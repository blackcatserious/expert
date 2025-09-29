import {
  CoreMessage,
  DataStreamWriter,
  JSONValue,
  generateId
} from 'ai'
import { z } from 'zod'

import { retrieveSchema } from '../schema/retrieve'
import { searchSchema } from '../schema/search'
import { retrieveTool } from '../tools/retrieve'
import { search } from '../tools/search'
import { videoSearchTool } from '../tools/video-search'
import { ExtendedCoreMessage, SearchResults } from '../types'

import { buildToolPlan, getLastUserText, ToolPlan } from './tool-planner'

interface ToolExecutionResult {
  toolCallDataAnnotation: ExtendedCoreMessage | null
  toolCallMessages: CoreMessage[]
}

export async function executeToolCall(
  coreMessages: CoreMessage[],
  dataStream: DataStreamWriter,
  model: string,
  searchMode: boolean
): Promise<ToolExecutionResult> {
  // If search mode is disabled, return empty tool call
  if (!searchMode) {
    return { toolCallDataAnnotation: null, toolCallMessages: [] }
  }

  try {
    const toolPlan = await buildToolPlan({
      messages: coreMessages,
      model
    })

    const execution = await executePlannedTools({
      plan: toolPlan,
      dataStream
    })

    if (execution) {
      return execution
    }
  } catch (error) {
    console.error('Failed to execute planned tools:', error)
  }

  return fallbackSearch({ coreMessages, dataStream, model })
}

type ToolName = 'search' | 'retrieve' | 'videoSearch'

type ParsedToolParameters = {
  tool: ToolName
  parameters: Record<string, any>
}

interface ExecutePlannedToolsConfig {
  plan: ToolPlan
  dataStream: DataStreamWriter
}

interface ExecutedStep {
  id: string
  tool: ToolName
  description: string
  parameters: Record<string, any>
  result: any
  error?: string
}

const searchParameterParser = searchSchema.partial()
const retrieveParameterParser = retrieveSchema.partial()
const videoSearchParameterParser = z
  .object({ query: z.string() })
  .merge(searchParameterParser.pick({ max_results: true }))

async function executePlannedTools({
  plan,
  dataStream
}: ExecutePlannedToolsConfig): Promise<ToolExecutionResult | null> {
  const invocations = plan.toolInvocations
    .filter(invocation =>
      ['search', 'retrieve', 'videoSearch'].includes(invocation.tool)
    )
    .map(invocation => toolInvocationSchemaInternal.safeParse(invocation))
    .filter((parsed): parsed is z.SafeParseSuccess<InvocationData> => parsed.success)
    .map(parsed => parsed.data)

  if (invocations.length === 0) {
    return null
  }

  const executedSteps: ExecutedStep[] = []

  for (const invocation of invocations) {
    const parsed = parseInvocationParameters(invocation)

    if (!parsed) {
      continue
    }

    const toolCallId = `call_${generateId()}`
    const callAnnotation = {
      type: 'tool_call',
      data: {
        state: 'call' as const,
        toolCallId,
        toolName: parsed.tool,
        args: JSON.stringify(parsed.parameters),
        description: invocation.description
      }
    }

    dataStream.writeData(callAnnotation)

    try {
      const result = await runTool(parsed)

      const resultAnnotation = {
        ...callAnnotation,
        data: {
          ...callAnnotation.data,
          result: JSON.stringify(result),
          state: 'result' as const
        }
      }

      dataStream.writeMessageAnnotation(resultAnnotation)

      executedSteps.push({
        id: invocation.id,
        tool: parsed.tool,
        description: invocation.description,
        parameters: parsed.parameters,
        result
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown tool execution error'

      const errorAnnotation = {
        ...callAnnotation,
        data: {
          ...callAnnotation.data,
          state: 'result' as const,
          error: message
        }
      }

      dataStream.writeMessageAnnotation(errorAnnotation)

      executedSteps.push({
        id: invocation.id,
        tool: parsed.tool,
        description: invocation.description,
        parameters: parsed.parameters,
        result: null,
        error: message
      })
    }
  }

  if (executedSteps.length === 0) {
    return null
  }

  const toolCallDataAnnotation: ExtendedCoreMessage = {
    role: 'data',
    content: {
      type: 'tool_call',
      data: {
        state: 'result',
        toolCallId: 'agent_pipeline',
        toolName: 'agent',
        result: JSON.stringify({
          plan: plan.plan,
          steps: executedSteps
        })
      }
    } as JSONValue
  }

  const summary = buildExecutionSummary(executedSteps)

  const toolCallMessages: CoreMessage[] = [
    {
      role: 'assistant',
      content: summary
    },
    {
      role: 'user',
      content: plan.finalResponseInstruction
    }
  ]

  return { toolCallDataAnnotation, toolCallMessages }
}

type InvocationData = {
  id: string
  tool: ToolName
  description: string
  parameters: Record<string, any>
}

const toolInvocationSchemaInternal = z.object({
  id: z.string(),
  tool: z.enum(['search', 'retrieve', 'videoSearch']),
  description: z.string(),
  parameters: z.record(z.any())
})

function parseInvocationParameters(
  invocation: z.infer<typeof toolInvocationSchemaInternal>
): ParsedToolParameters | null {
  try {
    switch (invocation.tool) {
      case 'search': {
        const params = searchParameterParser.parse(invocation.parameters)
        if (!params.query) {
          return null
        }
        return { tool: 'search', parameters: params }
      }
      case 'retrieve': {
        const params = retrieveParameterParser.parse(invocation.parameters)
        if (!params.url) {
          return null
        }
        return { tool: 'retrieve', parameters: params }
      }
      case 'videoSearch': {
        const params = videoSearchParameterParser.parse(invocation.parameters)
        return { tool: 'videoSearch', parameters: params }
      }
      default:
        return null
    }
  } catch (error) {
    console.warn('Failed to parse tool parameters', invocation, error)
    return null
  }
}

async function runTool(parsed: ParsedToolParameters) {
  switch (parsed.tool) {
    case 'search':
      return await search(
        parsed.parameters.query,
        parsed.parameters.max_results,
        parsed.parameters.search_depth,
        parsed.parameters.include_domains,
        parsed.parameters.exclude_domains
      )
    case 'retrieve':
      return await retrieveTool.execute(parsed.parameters, {
        toolCallId: parsed.parameters.url,
        messages: []
      })
    case 'videoSearch':
      return await videoSearchTool.execute(parsed.parameters, {
        toolCallId: parsed.parameters.query,
        messages: []
      })
    default:
      return null
  }
}

function buildExecutionSummary(steps: ExecutedStep[]): string {
  const parts = steps.map(step => {
    if (step.error) {
      return `• ${step.description}\n  ⚠️ ${step.error}`
    }

    switch (step.tool) {
      case 'search':
        return formatSearchSummary(step)
      case 'retrieve':
        return formatRetrieveSummary(step)
      case 'videoSearch':
        return formatVideoSummary(step)
      default:
        return ''
    }
  })

  return (
    'External research summary:\n\n' +
    parts
      .filter(Boolean)
      .map(part => part.trim())
      .join('\n\n')
  )
}

function formatSearchSummary(step: ExecutedStep): string {
  const result = step.result as SearchResults | null

  if (!result || !Array.isArray(result.results) || result.results.length === 0) {
    return `• ${step.description}\n  – No results found.`
  }

  const topResults = result.results.slice(0, 3)
  const formatted = topResults
    .map(item => {
      const snippet = item.content.replace(/\s+/g, ' ').slice(0, 160)
      return `  – ${item.title} (${item.url})\n    ${snippet}${
        item.content.length > 160 ? '…' : ''
      }`
    })
    .join('\n')

  return `• ${step.description}\n${formatted}`
}

function formatRetrieveSummary(step: ExecutedStep): string {
  const result = step.result as SearchResults | null
  if (!result || !Array.isArray(result.results) || result.results.length === 0) {
    return `• ${step.description}\n  – Unable to retrieve content.`
  }

  const item = result.results[0]
  const snippet = item.content.replace(/\s+/g, ' ').slice(0, 200)
  return `• ${step.description}\n  – ${item.url}\n    ${snippet}${
    item.content.length > 200 ? '…' : ''
  }`
}

function formatVideoSummary(step: ExecutedStep): string {
  const result = step.result as
    | { videos?: Array<{ title: string; link: string; snippet?: string }> }
    | null

  const videos = result?.videos

  if (!videos || videos.length === 0) {
    return `• ${step.description}\n  – No relevant videos found.`
  }

  const formatted = videos
    .slice(0, 3)
    .map(video => {
      const snippet = (video.snippet || '').replace(/\s+/g, ' ').slice(0, 160)
      return `  – ${video.title} (${video.link})${
        snippet ? `\n    ${snippet}${video.snippet && video.snippet.length > 160 ? '…' : ''}` : ''
      }`
    })
    .join('\n')

  return `• ${step.description}\n${formatted}`
}

async function fallbackSearch({
  coreMessages,
  dataStream,
  model
}: {
  coreMessages: CoreMessage[]
  dataStream: DataStreamWriter
  model: string
}): Promise<ToolExecutionResult> {
  const query = getLastUserText(coreMessages)

  if (!query) {
    return { toolCallDataAnnotation: null, toolCallMessages: [] }
  }

  const toolCallId = `call_${generateId()}`

  const callAnnotation = {
    type: 'tool_call',
    data: {
      state: 'call' as const,
      toolCallId,
      toolName: 'search',
      args: JSON.stringify({ query })
    }
  }

  dataStream.writeData(callAnnotation)

  const result = await search(query)

  const resultAnnotation = {
    ...callAnnotation,
    data: {
      ...callAnnotation.data,
      result: JSON.stringify(result),
      state: 'result' as const
    }
  }

  dataStream.writeMessageAnnotation(resultAnnotation)

  const toolCallDataAnnotation: ExtendedCoreMessage = {
    role: 'data',
    content: {
      type: 'tool_call',
      data: resultAnnotation.data
    } as JSONValue
  }

  const summary = buildExecutionSummary([
    {
      id: 'fallback-search',
      tool: 'search',
      description: `Search the web for up-to-date information about "${query}"`,
      parameters: { query },
      result
    }
  ])

  return {
    toolCallDataAnnotation,
    toolCallMessages: [
      { role: 'assistant', content: summary },
      {
        role: 'user',
        content: 'Please answer the user using the collected information.'
      }
    ]
  }
}
