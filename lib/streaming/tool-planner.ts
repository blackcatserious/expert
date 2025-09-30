import { CoreMessage, generateObject } from 'ai'
import { z } from 'zod'

import { getModel } from '@/lib/utils/registry'

const toolInvocationSchema = z.object({
  id: z
    .string()
    .min(1)
    .describe(
      'A short identifier for the step. Use kebab-case verbs such as "initial-search".'
    ),
  tool: z
    .enum(['search', 'retrieve', 'videoSearch', 'none'])
    .describe('Which tool to use for this step.'),
  description: z
    .string()
    .min(1)
    .describe(
      'Explain why the tool is needed and what you are hoping to learn. Match the language of the user.'
    ),
  parameters: z
    .record(z.any())
    .default({})
    .describe('Parameters for the tool. Leave empty when not needed.')
})

export const DEFAULT_FINAL_RESPONSE_INSTRUCTION =
  'Respond to the original user request using the collected information.'

const planSchema = z.object({
  plan: z
    .array(
      z.object({
        step: z
          .string()
          .min(1)
          .describe('Short natural language step description.'),
        detail: z
          .string()
          .min(1)
          .describe('Reasoning for the step. Match the language of the user.')
      })
    )
    .max(6)
    .default([])
    .describe('High level plan before executing tools.'),
  toolInvocations: z
    .array(toolInvocationSchema)
    .max(6)
    .default([])
    .describe('Concrete tool calls to execute.'),
  finalResponseInstruction: z
    .string()
    .default(DEFAULT_FINAL_RESPONSE_INSTRUCTION)
    .describe('Instruction for how the final answer should be framed. Use the user language.')
})

export type ToolPlan = z.infer<typeof planSchema>

export async function buildToolPlan({
  messages,
  model
}: {
  messages: CoreMessage[]
  model: string
}): Promise<ToolPlan> {
  const plannerResult = await generateObject({
    model: getModel(model),
    system: `You are a senior research planner that prepares multi-step tool usage for another model.
You must think carefully before deciding whether tools are needed.
Tools available:
- search: run a web search. Provide a clear query and optional parameters.
- retrieve: extract content from a single user-provided URL. Only use it when the user explicitly shared the URL.
- videoSearch: find relevant videos. Only use when the request is clearly about videos or multimedia.

Return at most 6 tool invocations. If no tool is helpful, return an empty list.
Never invent URLs. When referencing text from previous tools later, ensure you recorded the step id so the responder can cite it.
Always match the language of the user in descriptions and instructions.
`,
    messages,
    schema: planSchema
  })

  return plannerResult.object
}

export function getLastUserText(messages: CoreMessage[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message.role !== 'user') continue

    if (typeof message.content === 'string') {
      return message.content
    }

    if (Array.isArray(message.content)) {
      const textParts = message.content
        .map(part => (part.type === 'text' ? part.text : ''))
        .filter(Boolean)
      if (textParts.length > 0) {
        return textParts.join('\n')
      }
    }
  }

  return ''
}
