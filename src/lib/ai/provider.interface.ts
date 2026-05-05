export type AIMessageRole = 'user' | 'assistant'

export interface AIMessage {
  role: AIMessageRole
  content: string
}

export interface AIToolParameter {
  type: string
  description?: string
  enum?: string[]
  items?: AIToolParameter
  properties?: Record<string, AIToolParameter>
  required?: string[]
}

export interface AITool {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, AIToolParameter>
    required?: string[]
  }
}

export type AIStreamChunkType = 'text' | 'tool_call' | 'tool_result' | 'done' | 'error'

export interface AIStreamChunk {
  type: AIStreamChunkType
  // text delta for 'text' chunks
  content?: string
  // tool_call fields — emitted for client side-effects (navigation, approvals)
  toolCallId?: string
  toolName?: string
  toolInput?: Record<string, unknown>
  // toolResult on a tool_call chunk carries the JSON payload for the client
  // (navigation path, approval action). Tool results for Claude's agentic
  // loop are handled internally by the provider — not sent to the client.
  toolResult?: string
  // error message
  error?: string
}

export interface AIProviderOptions {
  systemPrompt: string
  messages: AIMessage[]
  tools: AITool[]
  onChunk: (chunk: AIStreamChunk) => void
  maxTokens?: number
}

export interface AIProvider {
  chat(options: AIProviderOptions): Promise<void>
}