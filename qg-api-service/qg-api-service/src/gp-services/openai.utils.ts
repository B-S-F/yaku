import * as tiktoken from 'tiktoken'
import { TiktokenModel } from 'tiktoken'

export type Roles = 'function' | 'system' | 'user' | 'assistant' | 'tool'

export type PromptConfig = {
  model: string
  temperature: number
  max_tokens: number
  top_p: number
  frequency_penalty: number
  presence_penalty: number
  stop: string
}

export type Prompt = {
  role: Roles
  content: string
}

export class OpenAIInitializationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OpenAIInitializationError'
  }
}

export const getTokenLength = async (
  text: string,
  model: TiktokenModel = 'gpt-3.5-turbo'
): Promise<number> => {
  try {
    const tk = await tiktoken.encoding_for_model(model)
    const encoded = tk.encode(text)
    return encoded.length
  } catch (error: any) {
    throw new Error('Tiktoken error getting token length: ' + error.message)
  }
}

export const getMaxPromptLength = (includeResponse?: true): number => {
  //currently 'gpt-3.5-turbo-0301'
  const model = {
    context: 8192,
    max_out: 4097,
  }
  //We output a response of max 800 tokens
  const maxTokensResponse = 800

  return includeResponse ? model.context - maxTokensResponse : model.context
}
