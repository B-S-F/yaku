import { Test, TestingModule } from '@nestjs/testing'
import { ExplanationsService } from './explanations.service'
import { generatePrompt } from './prompt.service'
import { RunService } from '../run/run.service'
import { OpenAIService } from '../../gp-services/openai.service'
import { NotFoundException, UnprocessableEntityException } from '@nestjs/common'
import { LoggerModule, PinoLogger } from 'nestjs-pino'
import { Readable } from 'stream'
import { ConfigsService } from '../configs/configs.service'
import { parseRunFiles } from './file.service'

jest.mock('./prompt.service', () => ({
  generatePrompt: jest.fn(),
}))
jest.mock('./file.service', () => ({
  parseRunFiles: jest.fn(),
}))

describe('ExplanationsService', () => {
  let service: ExplanationsService
  let runService: Partial<RunService>

  beforeEach(async () => {
    const sampleFileStream: Promise<Buffer> = new Promise((resolve) => {
      const stream = new Readable()
      stream.push('Sample YAML data')
      stream.push(null)
      resolve(Buffer.from(stream.read()))
    })

    ;(parseRunFiles as jest.Mock).mockImplementation(() => {
      return {
        name: 'Sample YAML data',
      }
    })
    ;(generatePrompt as jest.Mock).mockImplementation(() => {
      return [
        {
          role: 'user',
          content: 'example prompt',
        },
      ]
    })

    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule.forRoot({})],
      providers: [
        ExplanationsService,
        {
          provide: RunService,
          useValue: {
            get: jest.fn().mockResolvedValue({
              config: { id: 1 },
            }),
          } as Partial<RunService>,
        },
        {
          provide: ConfigsService,
          useValue: {
            getConfig: jest.fn().mockResolvedValue({
              files: [{ filename: 'sample.yaml' }],
            }),
            getFileContent: jest.fn().mockResolvedValue(sampleFileStream),
          } as Partial<ConfigsService>,
        },
        {
          provide: OpenAIService,
          useValue: {
            sendMessages: jest.fn().mockResolvedValue({
              choices: [{ message: { content: 'Mock OpenAI Response' } }],
            }),
          } as Partial<OpenAIService>,
        },
        {
          provide: PinoLogger,
          useValue: { debug: jest.fn(), error: jest.fn(), trace: jest.fn() },
        },
      ],
    }).compile()

    service = module.get<ExplanationsService>(ExplanationsService)
    runService = module.get<Partial<RunService>>(RunService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('getExplanation', () => {
    it('should return explanation when QG config exists', async () => {
      const namespaceId = 1
      const runId = 1
      const chapter = 'chapter'
      const requirement = 'requirement'
      const check = 'check'

      const explanation = await service.getExplanation(
        namespaceId,
        runId,
        chapter,
        requirement,
        check
      )

      expect(explanation).toEqual('Mock OpenAI Response')
    })

    it('should throw NotFoundException when QG run not found', async () => {
      const namespaceId = 1
      const runId = 1
      const chapter = 'chapter'
      const requirement = 'requirement'
      const check = 'check'

      ;(runService.get as jest.Mock).mockImplementation(() => {
        return new Error('QG result not found')
      })

      await expect(
        service.getExplanation(namespaceId, runId, chapter, requirement, check)
      ).rejects.toThrowError(NotFoundException)
    })

    it('should throw UnprocessableEntityException when file processing fails', async () => {
      const namespaceId = 1
      const runId = 1
      const chapter = 'chapter'
      const requirement = 'requirement'
      const check = 'check'

      ;(parseRunFiles as jest.Mock).mockImplementation(() => {
        throw new Error('Failed to parse run files')
      })

      await expect(
        service.getExplanation(namespaceId, runId, chapter, requirement, check)
      ).rejects.toThrowError(UnprocessableEntityException)
    })

    it('should throw UnprocessableEntityException when generating prompt fails', async () => {
      const namespaceId = 1
      const runId = 1
      const chapter = 'chapter'
      const requirement = 'requirement'
      const check = 'check'

      ;(generatePrompt as jest.Mock).mockImplementation(() => {
        throw new Error('Failed to generate prompt')
      })

      await expect(
        service.getExplanation(namespaceId, runId, chapter, requirement, check)
      ).rejects.toThrowError(UnprocessableEntityException)
    })
  })
})
