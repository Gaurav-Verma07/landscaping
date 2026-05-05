import type { AIProvider } from "./provider.interface";

export function getAIProvider():AIProvider{
    const provider= (process.env.AI_PROVIDER??'anthropic').toLowerCase().trim()

    switch(provider){
        case 'openai':{
            const {OpenAIProvider}= require('./providers/openai')
            return new OpenAIProvider()
        }
        case 'gemini':{
            const {GeminiProvider}= require('./providers/gemini')
            return new GeminiProvider()
        }
        case 'anthropic':
        default:{
            const {AnthropicProvider}= require('./providers/anthropic')
            return new AnthropicProvider()
        }
    }
}