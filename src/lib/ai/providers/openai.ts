import OpenAI from 'openai'
import type { AIProvider, AIProviderOptions, AITool } from "../provider.interface";

function toOpenAITools(tools: AITool[]):OpenAI.ChatCompletionTool[]{
    return tools.map((t)=>({
        type: 'function'as const,
        function:{
            name: t.name,
            description: t.description,
            parameters:{
                type:'object',
                properties:t.parameters.properties,
                required: t.parameters.required??[]
            }
        }
    }))
}

export class OpenAIProvider implements AIProvider{
    private client: OpenAI
    constructor(){
        this.client= new OpenAI({
            apiKey: process.env.OPENAI_API_KEY!,
        })
    }

    async chat(options: AIProviderOptions):Promise<void>{
        const {systemPrompt, messages, tools, onChunk, maxTokens= 4096}= options

        const model= process.env.AI_MODEL??'gpt-4o-mini'

        const stream= await this.client.chat.completions.create({
            model,
            max_tokens: maxTokens,
            stream: true,
            tools: toOpenAITools(tools),
            messages: [
                {
                    role: 'system', content: systemPrompt
                },
                ...messages.map((m)=>({
                    role: m.role,
                    content: m.content
                })),
            ],
        })

        const toolCallAccumulator: Record<number, {
            id: string; name: string; arguments: string
        }>
        = {}

        for await (const chunk of stream){
            const delta= chunk.choices[0]?.delta

            if(delta?.content){
                onChunk({
                    type: 'text',
                    content: delta.content
                })
            }

            if(delta?.tool_calls){
                for(const tc of delta.tool_calls){
                    const idx= tc.index
                    if(!toolCallAccumulator[idx]){
                        toolCallAccumulator[idx]= {
                            id: tc.id??'',
                            name: tc.function?.name??'',
                            arguments:''
                        }
                    }
                    if(tc.id) toolCallAccumulator[idx].id= tc.id
                    if(tc.function?.name) toolCallAccumulator[idx].name= tc.function.name
                    if(tc.function?.arguments)toolCallAccumulator[idx].arguments+= tc.function.arguments
                }
            }

            if(chunk.choices[0]?.finish_reason==='tool_calls'){
                for(const tc of Object.values(toolCallAccumulator)){
                    const parsed: Record<string, unknown>= {}
                    try{parsed: JSON.parse(tc.arguments)}catch{}
                    onChunk({
                        type:'tool_call',
                        toolCallId: tc.id,
                        toolName: tc.name,
                        toolInput: parsed
                    })
                }
            }
        }

        onChunk({type: 'done'})
    }
}