import {
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common'
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino'
import { RunService } from '../run/run.service'
import { parseRunFiles } from './file.service'
import { generatePrompt } from './prompt.service'
import { OpenAIService } from '../../gp-services/openai.service'
import { QG_LOG_LEVEL } from '../../config'
import { File } from './types'
import {
  OpenAIInitializationError,
  Prompt,
} from '../../gp-services/openai.utils'
import { ConfigsService } from '../configs/configs.service'

@Injectable()
export class ExplanationsService {
  @InjectPinoLogger(ExplanationsService.name)
  private readonly logger = new PinoLogger({
    pinoHttp: {
      level: QG_LOG_LEVEL,
      serializers: {
        req: () => undefined,
        res: () => undefined,
      },
    },
  })

  constructor(
    @Inject(RunService) private readonly runService: RunService,
    @Inject(OpenAIService) private readonly openaiService: OpenAIService,
    @Inject(ConfigsService) private readonly configsService: ConfigsService
  ) {}

  private async getConfigId(
    namespaceId: number,
    runId: number
  ): Promise<number> {
    const run = await this.runService.get(namespaceId, runId)
    return run.config.id
  }

  private async getFileContent(
    namespaceId: number,
    configId: number,
    fileName: string
  ): Promise<string> {
    const fileBuffer = await this.configsService.getFileContent(
      namespaceId,
      configId,
      fileName
    )

    return fileBuffer.toString()
  }

  async getExplanation(
    namespaceId: number,
    runId: number,
    chapter: string,
    requirement: string,
    check: string
  ): Promise<string> {
    let configId: number
    const files: File[] = []

    //1. Get run files, qg-config.yaml + other used files if the case
    try {
      configId = await this.getConfigId(namespaceId, runId)
      const configs = await this.configsService.getConfig(namespaceId, configId)
      for (const file of configs.files) {
        const content = await this.getFileContent(
          namespaceId,
          configId,
          file.filename
        )
        files.push({
          filename: file.filename,
          content: content,
        })
      }
    } catch (error) {
      this.logger.error(`Error getting QG run files: ${error.message}`)
      throw new NotFoundException('Could not find the QG run.')
    }

    let parsedFiles: File[]

    //2. Parse/trim the run files and remove files other than configs, such as data files
    try {
      parsedFiles = parseRunFiles(files, chapter, requirement, check)
    } catch (error) {
      this.logger.error(
        `Issue encountered when trying to parse run files': ${error.message}`
      )
      throw new UnprocessableEntityException(
        'Could not understand the qg-config.'
      )
    }
    //3. Create the System and User prompts
    let prompts: Prompt[]
    try {
      prompts = await generatePrompt(parsedFiles)
    } catch (error) {
      this.logger.error(`Error generating prompt: ${error.message}`)
      throw new UnprocessableEntityException('Could not process the qg-config.')
    }

    //4. Send the prompts to OpenAI and get the response
    try {
      const response = await this.openaiService.sendMessages(prompts)
      return response.choices[0].message.content
    } catch (error) {
      if (error instanceof OpenAIInitializationError) {
        this.logger.error(`OpenAI initialization error: ${error.message}`)
        throw new UnprocessableEntityException(
          'Explanation Service not available.'
        )
      }

      this.logger.error(`Error sending messages: ${error.message}`)
      throw new UnprocessableEntityException(
        'Explanation Service could not create an explanation.'
      )
    }
  }
}
