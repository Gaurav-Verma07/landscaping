import { GoogleGenerativeAI, SchemaType,  } from '@google/generative-ai'
import type { AIProvider, AIProviderOptions, AITool } from '../provider.interface'
import { executeTool } from '../tool-executor'

function toGeminiTools(tools: AITool[]) {
  return [
    {
      functionDeclarations: tools.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: {
          type: SchemaType.OBJECT,
          properties: t.parameters.properties,
          required: t.parameters.required ?? [],
        },
      })),
    },
  ]
}

export class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI

  constructor() {
    this.client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  }

  async chat(options: AIProviderOptions): Promise<void> {
    const { systemPrompt, messages, tools, onChunk, maxTokens = 4096 } = options

    const modelName = process.env.AI_MODEL ?? 'gemini-2.0-flash'

    const model = this.client.getGenerativeModel({
      model: modelName,
      systemInstruction: systemPrompt,
      tools: toGeminiTools(tools) as any,
      generationConfig: { maxOutputTokens: maxTokens },
    })

    // Build Gemini history from all messages except the last
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

    const lastMessage = messages[messages.length - 1]?.content ?? ''

    // ── Agentic loop ───────────────────────────────────────────────────────────
    // Gemini may call multiple tools before giving a final answer.
    // Each iteration: send message → if function calls, execute → feed results back → repeat.

    const chat = model.startChat({ history })
    let currentMessage: string | object[] = lastMessage
    let iterations = 0
    const MAX_ITERATIONS = 10

    while (iterations < MAX_ITERATIONS) {
      iterations++

      const result = await chat.sendMessage(currentMessage as any)
      const response = result.response

      // Stream text to client
      const text = response.text()
      if (text) {
        onChunk({ type: 'text', content: text })
      }

      // Check for function calls
      const functionCalls = response.functionCalls()
      if (!functionCalls || functionCalls.length === 0) {
        // No tool calls — Gemini is done
        break
      }

      // Execute each tool and collect results
      const functionResponses: object[] = []
      let hasApprovalPending = false

      for (const call of functionCalls) {
        const toolInput = call.args as Record<string, unknown>
        const toolResult = await executeTool(call.name, toolInput)

        if (toolResult.type === 'requires_approval') {
          hasApprovalPending = true

          // Notify client of pending approval
          onChunk({
            type: 'tool_call',
            toolCallId: call.name,
            toolName: call.name,
            toolInput,
            toolResult: JSON.stringify({
              requires_approval: true,
              action: toolResult.action,
            }),
          })

          // Placeholder result so conversation stays valid
          functionResponses.push({
            functionResponse: {
              name: call.name,
              response: { result: 'Action requires user approval before executing.' },
            },
          })
        } else if (toolResult.type === 'data') {
          const data = toolResult.data as Record<string, unknown>

          // Navigation side-effect — notify client
          if (data?.navigating && data?.path) {
            onChunk({
              type: 'tool_call',
              toolCallId: call.name,
              toolName: call.name,
              toolInput,
              toolResult: JSON.stringify(data),
            })
          }

          functionResponses.push({
            functionResponse: {
              name: call.name,
              response: { result: JSON.stringify(toolResult.data) },
            },
          })
        } else {
          functionResponses.push({
            functionResponse: {
              name: call.name,
              response: { error: toolResult.message },
            },
          })
        }
      }

      // If any tool needs approval, stop — user must confirm first
      if (hasApprovalPending) break

      // Feed all tool results back to Gemini for next turn
      currentMessage = functionResponses
    }

    onChunk({ type: 'done' })
  }
}