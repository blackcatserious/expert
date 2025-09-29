import { CoreMessage, DataStreamWriter, generateId, JSONValue } from 'ai'
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

interface SourceReference {
  marker: string
  url: string
  title?: string
  stepId: string
}

interface ExecutionSummary {
  summary: string
  sources: SourceReference[]
}

const searchParameterParser = searchSchema
const retrieveParameterParser = retrieveSchema
const videoSearchParameterParser = z.object({
  query: searchSchema.shape.query,
  max_results: searchSchema.shape.max_results,
  search_depth: z.enum(['basic', 'advanced']).optional(),
  include_domains: searchSchema.shape.include_domains,
  exclude_domains: searchSchema.shape.exclude_domains
})

type SearchParameters = z.infer<typeof searchParameterParser>
type RetrieveParameters = z.infer<typeof retrieveParameterParser>
type VideoSearchParameters = z.infer<typeof videoSearchParameterParser>

type ParsedToolParameters =
  | { tool: 'search'; parameters: SearchParameters }
  | { tool: 'retrieve'; parameters: RetrieveParameters }
  | { tool: 'videoSearch'; parameters: VideoSearchParameters }

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

  const summary = buildExecutionSummary(executedSteps)

  const toolCallDataAnnotation: ExtendedCoreMessage = {
    role: 'data',
    content: {
      type: 'tool_call',
      data: {
        state: 'result',
        toolCallId: 'agent_pipeline',
        toolName: 'agent',
        result: stringifyResultWithSources(
          {
            plan: plan.plan,
            steps: executedSteps
          },
          summary.sources
        )
      }
    } as JSONValue
  }

  const toolCallMessages = createToolResponderMessages({
    plan,
    executedSteps,
    summary
  })

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
      case 'search':
        return {
          tool: 'search',
          parameters: searchParameterParser.parse(invocation.parameters)
        }
      case 'retrieve':
        return {
          tool: 'retrieve',
          parameters: retrieveParameterParser.parse(invocation.parameters)
        }
      case 'videoSearch':
        return {
          tool: 'videoSearch',
          parameters: videoSearchParameterParser.parse(invocation.parameters)
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
    case 'search': {
      const normalizedSearchDepth =
        parsed.parameters.search_depth === 'advanced' ||
        parsed.parameters.search_depth === 'basic'
          ? parsed.parameters.search_depth
          : undefined

      return await search(
        parsed.parameters.query,
        parsed.parameters.max_results,
        normalizedSearchDepth,
        parsed.parameters.include_domains,
        parsed.parameters.exclude_domains
      )
    }
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

function buildExecutionSummary(steps: ExecutedStep[]): ExecutionSummary {
  let nextMarkerIndex = 1
  const sources: SourceReference[] = []

  const parts = steps.map(step => {
    if (step.error) {
      return `• ${step.description}\n  ⚠️ ${step.error}`
    }

    switch (step.tool) {
      case 'search': {
        const { text, nextIndex } = formatSearchSummary(step, {
          startIndex: nextMarkerIndex,
          sources
        })
        nextMarkerIndex = nextIndex
        return text
      }
      case 'retrieve': {
        const { text, nextIndex } = formatRetrieveSummary(step, {
          startIndex: nextMarkerIndex,
          sources
        })
        nextMarkerIndex = nextIndex
        return text
      }
      case 'videoSearch': {
        const { text, nextIndex } = formatVideoSummary(step, {
          startIndex: nextMarkerIndex,
          sources
        })
        nextMarkerIndex = nextIndex
        return text
      }
      default:
        return ''
    }
  })

  const filtered = parts.filter(Boolean).map(part => part.trim())
  const sourcesDirectory = formatSourcesDirectory(sources)

  const summary =
    'External research summary:\n\n' +
    filtered.join('\n\n') +
    (sourcesDirectory ? `\n\n${sourcesDirectory}` : '')

  return {
    summary,
    sources
  }
}

function formatSearchSummary(
  step: ExecutedStep,
  context: { startIndex: number; sources: SourceReference[] }
): { text: string; nextIndex: number } {
  const result = step.result as SearchResults | null

  if (!result || !Array.isArray(result.results) || result.results.length === 0) {
    return { text: `• ${step.description}\n  – No results found.`, nextIndex: context.startIndex }
  }

  const topResults = result.results.slice(0, 3)
  const formatted = topResults
    .map((item, index) => {
      const marker = createMarker(context.startIndex + index)
      context.sources.push({
        marker,
        url: item.url,
        title: item.title,
        stepId: step.id
      })
      const snippet = item.content.replace(/\s+/g, ' ').slice(0, 160)
      return `  ${marker} ${item.title} – ${item.url}\n    ${snippet}${
        item.content.length > 160 ? '…' : ''
      }`
    })
    .join('\n')

  return {
    text: `• ${step.description}\n${formatted}`,
    nextIndex: context.startIndex + topResults.length
  }
}

function formatRetrieveSummary(
  step: ExecutedStep,
  context: { startIndex: number; sources: SourceReference[] }
): { text: string; nextIndex: number } {
  const result = step.result as SearchResults | null
  if (!result || !Array.isArray(result.results) || result.results.length === 0) {
    return {
      text: `• ${step.description}\n  – Unable to retrieve content.`,
      nextIndex: context.startIndex
    }
  }

  const marker = createMarker(context.startIndex)
  const item = result.results[0]
  const snippet = item.content.replace(/\s+/g, ' ').slice(0, 200)

  context.sources.push({
    marker,
    url: item.url,
    title: item.title,
    stepId: step.id
  })

  return {
    text: `• ${step.description}\n  ${marker} ${item.url}\n    ${snippet}${
      item.content.length > 200 ? '…' : ''
    }`,
    nextIndex: context.startIndex + 1
  }
}

function formatVideoSummary(
  step: ExecutedStep,
  context: { startIndex: number; sources: SourceReference[] }
): { text: string; nextIndex: number } {
  const result = step.result as
    | { videos?: Array<{ title: string; link: string; snippet?: string }> }
    | null

  const videos = result?.videos

  if (!videos || videos.length === 0) {
    return {
      text: `• ${step.description}\n  – No relevant videos found.`,
      nextIndex: context.startIndex
    }
  }

  const limitedVideos = videos.slice(0, 3)
  const formatted = limitedVideos
    .map((video, index) => {
      const marker = createMarker(context.startIndex + index)
      context.sources.push({
        marker,
        url: video.link,
        title: video.title,
        stepId: step.id
      })
      const snippet = (video.snippet || '').replace(/\s+/g, ' ').slice(0, 160)
      return `  ${marker} ${video.title} – ${video.link}${
        snippet
          ? `\n    ${snippet}${
              video.snippet && video.snippet.length > 160 ? '…' : ''
            }`
          : ''
      }`
    })
    .join('\n')

  return {
    text: `• ${step.description}\n${formatted}`,
    nextIndex: context.startIndex + limitedVideos.length
  }
}

function formatSourcesDirectory(sources: SourceReference[]): string {
  if (sources.length === 0) {
    return ''
  }

  const lines = sources.map(source => {
    const titlePart = source.title ? `${source.title} – ` : ''
    return `${source.marker} ${titlePart}${source.url}`
  })

  return 'Source directory:\n' + lines.join('\n')
}

function createMarker(index: number): string {
  return `[${index}]`
}

function createToolResponderMessages({
  plan,
  executedSteps,
  summary
}: {
  plan: ToolPlan
  executedSteps: ExecutedStep[]
  summary: ExecutionSummary
}): CoreMessage[] {
  const messages: CoreMessage[] = []

  messages.push({
    role: 'assistant',
    content: buildPlanAndExecutionOverview(plan, executedSteps)
  })

  messages.push({
    role: 'assistant',
    content: summary.summary
  })

  messages.push({
    role: 'user',
    content: buildFinalResponderInstruction(
      plan.finalResponseInstruction,
      summary.sources
    )
  })

  return messages
}

function buildPlanAndExecutionOverview(
  plan: ToolPlan,
  executedSteps: ExecutedStep[]
): string {
  const planLines = plan.plan.map((step, index) => {
    return `${index + 1}. ${step.step}\n   ${step.detail}`
  })

  const invocationLines = executedSteps.map(step => {
    const status = step.error ? `Failed: ${step.error}` : 'Completed successfully'
    return `- ${step.id} (${step.tool})\n  Description: ${step.description}\n  Status: ${status}`
  })

  const plannedSection =
    planLines.length > 0
      ? ['Planned approach:', ...planLines].join('\n')
      : 'Planned approach:\nNo explicit high-level plan provided by the planner.'

  const executedSection =
    invocationLines.length > 0
      ? ['Executed tool runs:', ...invocationLines].join('\n')
      : 'Executed tool runs:\nNo tools were executed.'

  return `${plannedSection}\n\n${executedSection}`
}

function buildFinalResponderInstruction(
  baseInstruction: string,
  sources: SourceReference[]
): string {
  if (sources.length === 0) {
    return (
      baseInstruction +
      '\n\nNo external sources were gathered. Answer using your existing knowledge and note the limitation.'
    )
  }

  const markers = sources.map(source => source.marker).join(', ')

  return (
    baseInstruction +
    '\n\nUse the numbered sources ' +
    markers +
    ' from the research summary when citing evidence. Follow the [number](url) citation format.'
  )
}

function buildFallbackOverview(executedSteps: ExecutedStep[]): string {
  const details = executedSteps.map(step => {
    return `- ${step.description}\n  Status: ${step.error ? `Failed: ${step.error}` : 'Completed successfully'}`
  })

  return `Executed tool runs:\n${details.join('\n')}`
}

function stringifyResultWithSources(
  payload: unknown,
  sources: SourceReference[]
): string {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    return JSON.stringify({ ...(payload as Record<string, unknown>), sources })
  }

  return JSON.stringify({ value: payload, sources })
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

  const executedSteps: ExecutedStep[] = [
    {
      id: 'fallback-search',
      tool: 'search',
      description: `Search the web for up-to-date information about "${query}"`,
      parameters: { query },
      result
    }
  ]

  const summary = buildExecutionSummary(executedSteps)

  const toolCallMessages: CoreMessage[] = [
    {
      role: 'assistant',
      content: buildFallbackOverview(executedSteps)
    },
    {
      role: 'assistant',
      content: summary.summary
    },
    {
      role: 'user',
      content: buildFinalResponderInstruction(
        'Please answer the user using the collected information.',
        summary.sources
      )
    }
  ]

  return {
    toolCallDataAnnotation: {
      role: 'data',
      content: {
        type: 'tool_call',
        data: {
          ...resultAnnotation.data,
          result: stringifyResultWithSources(
            {
              result,
              steps: executedSteps
            },
            summary.sources
          )
        }
      } as JSONValue
    },
    toolCallMessages
  }
}
