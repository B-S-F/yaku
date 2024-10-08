import OpenAI from 'openai'
import { Prompt, PromptConfig } from './openai.utils'
import { Inject, Injectable } from '@nestjs/common'
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino'
import {
  ENABLE_EXPLANATIONS_FEATURE,
  QG_LOG_LEVEL,
  HTTP_PROXY,
} from '../config'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { OpenAIInitializationError } from './openai.utils'

@Injectable()
export class OpenAIServiceConfig {
  constructor(
    readonly baseUrl: string,
    readonly apiVersion: string,
    readonly apiKey: string,
    readonly model: string
  ) {}
}

@Injectable()
export class OpenAIService {
  @InjectPinoLogger(OpenAIService.name)
  private readonly logger = new PinoLogger({
    pinoHttp: {
      level: QG_LOG_LEVEL,
      serializers: {
        req: () => undefined,
        res: () => undefined,
      },
    },
  })

  private openai: OpenAI

  constructor(
    @Inject(OpenAIServiceConfig)
    private readonly openaiConfig: OpenAIServiceConfig
  ) {
    // Azure OpenAI requires a custom baseURL, api-version query param, and api-key header.
    const baseConfig = {
      apiKey: this.openaiConfig.apiKey,
      baseURL: `${this.openaiConfig.baseUrl}/${this.openaiConfig.model}`,
      defaultQuery: { 'api-version': this.openaiConfig.apiVersion },
      defaultHeaders: { 'api-key': this.openaiConfig.apiKey },
    }

    let extraConfig = {}
    if (HTTP_PROXY) {
      const agent = new HttpsProxyAgent(HTTP_PROXY)
      extraConfig = { httpAgent: agent }
    }

    if (ENABLE_EXPLANATIONS_FEATURE === 'true') {
      try {
        this.openai = new OpenAI({ ...baseConfig, ...extraConfig })
      } catch (error) {
        throw new Error(`Error initializing OpenAI: ${error.message}`)
      }
    }
  }

  async sendMessages(
    prompt: Prompt[],
    config: PromptConfig = {
      model: this.openaiConfig.model,
      temperature: 0.4,
      max_tokens: 800,
      top_p: 1,
      frequency_penalty: 0.7,
      presence_penalty: 0,
      stop: 'None',
    }
  ) {
    if (!this.openai) {
      throw new OpenAIInitializationError('OpenAI not initialized')
    }
    const chatCompletion = await this.openai.chat.completions.create({
      messages: prompt.map((p) => ({
        role: p.role as any,
        content: p.content,
      })),
      ...config,
    })

    return chatCompletion
  }
}
