
import Anthropic from '@anthropic-ai/sdk'
import type { AIProvider, AIProviderOptions, AITool } from '../provider.interface'
import { executeTool } from '../tool-executor'

function toAnthropicTools(tools: AITool[]): Anthropic.Tool[] {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: {
      type: 'object' as const,
      properties: t.parameters.properties,
      required: t.parameters.required ?? [],
    },
  }))
}

export class AnthropicProvider implements AIProvider {
  private client: Anthropic

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    })
  }

  async chat(options: AIProviderOptions): Promise<void> {
    const { systemPrompt, messages, tools, onChunk, maxTokens = 4096 } = options

    const model = process.env.AI_MODEL ?? 'claude-sonnet-4-20250514'

    // Build Anthropic message history
    const anthropicMessages: Anthropic.MessageParam[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }))

    let iterations = 0
    const MAX_ITERATIONS = 10

    while (iterations < MAX_ITERATIONS) {
      iterations++

      const response = await this.client.messages.create({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        tools: toAnthropicTools(tools),
        messages: anthropicMessages,
      })

      // Stream text content to client
      for (const block of response.content) {
        if (block.type === 'text' && block.text) {
          onChunk({ type: 'text', content: block.text })
        }
      }

      // If Claude is done (no tool calls), break out
      if (response.stop_reason !== 'tool_use') {
        break
      }

      // Collect all tool use blocks
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
      )

      if (toolUseBlocks.length === 0) break

      // Add Claude's full response (including tool calls) to history
      anthropicMessages.push({
        role: 'assistant',
        content: response.content,
      })

      // Execute each tool and collect results
      const toolResults: Anthropic.ToolResultBlockParam[] = []
      let hasApprovalPending = false

      for (const toolUse of toolUseBlocks) {
        const toolInput = toolUse.input as Record<string, unknown>
        const result = await executeTool(toolUse.name, toolInput)

        if (result.type === 'requires_approval') {
          hasApprovalPending = true

          // Notify client of pending approval
          onChunk({
            type: 'tool_call',
            toolCallId: toolUse.id,
            toolName: toolUse.name,
            toolInput,
            toolResult: JSON.stringify({
              requires_approval: true,
              action: result.action,
            }),
          })

          // Placeholder so conversation history stays valid
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: 'Action requires user approval before executing.',
          })
        } else if (result.type === 'data') {
          const data = result.data as Record<string, unknown>

          // Notify client of navigation so it can router.push()
          if (data?.navigating && data?.path) {
            onChunk({
              type: 'tool_call',
              toolCallId: toolUse.id,
              toolName: toolUse.name,
              toolInput,
              toolResult: JSON.stringify(data),
            })
          }

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify(result.data),
          })
        } else {
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: `Error: ${result.message}`,
            is_error: true,
          })
        }
      }

      // If any tool needs approval, stop looping — user must confirm first
      if (hasApprovalPending) break

      // Feed all tool results back to Claude for the next turn
      anthropicMessages.push({
        role: 'user',
        content: toolResults,
      })
    }

    onChunk({ type: 'done' })
  }
}