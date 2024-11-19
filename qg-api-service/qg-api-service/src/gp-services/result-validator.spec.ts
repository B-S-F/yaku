// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { BadRequestException } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import fs from 'fs'
import * as YAML from 'yaml'
import { YamlValidatorService } from './yaml-validator.service'
import { ResultValidatorService } from './result-validator.service'

describe('ResultValidatorService', () => {
  let resultValidator: ResultValidatorService
  let qg_result_v1: any
  let qg_result_v2: any

  const validFilesV1: string[] = [
    'qg-result-v1-valid-all-fields.yaml',
    'qg-result-v1-valid-mandatory-fields.yaml',
  ]
  const validFilesV2: string[] = [
    'qg-result-v2-valid-all-fields.yaml',
    'qg-result-v2-valid-mandatory-fields.yaml',
  ]

  const validFileV1 = fs.readFileSync(
    `${__dirname}/fixtures/qg-result-v1-valid-all-fields.yaml`
  )
  const validFileV2 = fs.readFileSync(
    `${__dirname}/fixtures/qg-result-v2-valid-all-fields.yaml`
  )

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [ResultValidatorService, YamlValidatorService],
    }).compile()

    resultValidator = moduleRef.get<ResultValidatorService>(
      ResultValidatorService
    )

    qg_result_v1 = YAML.parse(validFileV1.toString('utf8'))
    qg_result_v2 = YAML.parse(validFileV2.toString('utf8'))
  })

  it('should be defined', () => {
    expect(resultValidator).toBeDefined()
  })

  it('should throw an error if the input is an invalid yaml file', async () => {
    const filename = 'invalid.yaml'

    const multerFile: Partial<Express.Multer.File> = {
      originalname: filename,
      buffer: fs.readFileSync(`${__dirname}/fixtures/${filename}`),
    }

    expect(() =>
      resultValidator.validate(multerFile as Express.Multer.File, filename)
    ).rejects.toEqual(
      new BadRequestException(`No valid yaml content for file ${filename}`)
    )
  })

  it('should throw an error if invalid version is given', async () => {
    const filename = 'qg-result-v1-valid-all-fields.yaml'
    qg_result_v1.metadata.version = 'v3'

    const multerFile: Partial<Express.Multer.File> = {
      originalname: 'qg-result-v1-valid-all-fields.yaml',
      buffer: Buffer.from(YAML.stringify(qg_result_v1)),
    }

    await expect(
      resultValidator.validate(multerFile as Express.Multer.File, filename)
    ).rejects.toEqual(
      new Error(`Invalid version for ${filename}. Valid versions: v1 or v2.`)
    )
  })

  it('should throw an error if metadata field is missing', async () => {
    delete qg_result_v1.metadata

    const multerFile: Partial<Express.Multer.File> = {
      originalname: 'qg-result-v1-valid-all-fields.yaml',
      buffer: Buffer.from(YAML.stringify(qg_result_v1)),
    }

    expect(
      resultValidator.validate(
        multerFile as Express.Multer.File,
        'missing_metadata'
      )
    ).rejects.toThrow()
  })

  it('should throw an error if header field is missing', async () => {
    delete qg_result_v1.header

    const multerFile: Partial<Express.Multer.File> = {
      originalname: 'qg-result-v1-valid-all-fields.yaml',
      buffer: Buffer.from(YAML.stringify(qg_result_v1)),
    }

    expect(
      resultValidator.validate(
        multerFile as Express.Multer.File,
        'missing_header'
      )
    ).rejects.toThrow()
  })

  it('should throw an error if overallStatus field is missing', async () => {
    delete qg_result_v1.overallStatus

    const multerFile: Partial<Express.Multer.File> = {
      originalname: 'qg-result-v1-valid-all-fields.yaml',
      buffer: Buffer.from(YAML.stringify(qg_result_v1)),
    }

    expect(
      resultValidator.validate(
        multerFile as Express.Multer.File,
        'missing_overallStatus'
      )
    ).rejects.toThrow()
  })

  it('should throw an error if statistics field is missing', async () => {
    delete qg_result_v1.statistics

    const multerFile: Partial<Express.Multer.File> = {
      originalname: 'qg-result-v1-valid-all-fields.yaml',
      buffer: Buffer.from(YAML.stringify(qg_result_v1)),
    }

    expect(
      resultValidator.validate(
        multerFile as Express.Multer.File,
        'missing_statistics'
      )
    ).rejects.toThrow()
  })

  it('should throw an error if chapters field is missing', async () => {
    delete qg_result_v1.chapters

    const multerFile: Partial<Express.Multer.File> = {
      originalname: 'qg-result-v1-valid-all-fields.yaml',
      buffer: Buffer.from(YAML.stringify(qg_result_v1)),
    }

    expect(
      resultValidator.validate(
        multerFile as Express.Multer.File,
        'missing_chapters'
      )
    ).rejects.toThrow()
  })

  it.each(validFilesV1)(
    'run gq-config validator with correctly formatted v1 files; expect to throw no error',
    async (file) => {
      const multerFile: Partial<Express.Multer.File> = {
        originalname: file,
        buffer: fs.readFileSync(`${__dirname}/fixtures/${file}`),
      }

      await resultValidator.validate(multerFile as Express.Multer.File, file)
    }
  )

  it.each(validFilesV1)(
    'run gq-config validator with correctly formatted v1 qg-config string; expect to throw no error',
    async (file) => {
      const qg_result_string = fs.readFileSync(
        `${__dirname}/fixtures/${file}`,
        { encoding: 'utf-8' }
      )
      await resultValidator.validate(qg_result_string)
    }
  )

  it.each(validFilesV2)(
    'run gq-config validator with correctly formatted v2 files; expect to throw no error',
    async (file) => {
      const multerFile: Partial<Express.Multer.File> = {
        originalname: file,
        buffer: fs.readFileSync(`${__dirname}/fixtures/${file}`),
      }

      await resultValidator.validate(multerFile as Express.Multer.File, file)
    }
  )

  it.each(validFilesV2)(
    'run gq-config validator with correctly formatted v2 qg-config string; expect to throw no error',
    async (file) => {
      const qg_result_string = fs.readFileSync(
        `${__dirname}/fixtures/${file}`,
        { encoding: 'utf-8' }
      )
      await resultValidator.validate(qg_result_string)
    }
  )

  it.each([
    'incorrect string',
    'metadata: { version: v1 }',
    'metadata: { version: v2 }',
    'metadata: { version: v1 ].',
  ])(
    'run qg-config validator with incorrectly formatted qg-result string; expect to throw error',
    async (qg_result_string) => {
      expect(resultValidator.validate(qg_result_string)).rejects.toThrow()
    }
  )

  it.each([
    { version: 12 },
    { version: true },
    { version: [] },
    { version: {} },
  ])(
    'run gq-config validator with incorrectly formatted metadata; expect to throw error',
    async (invalidMetadata: any) => {
      qg_result_v1.metadata = invalidMetadata

      const multerFile: Partial<Express.Multer.File> = {
        originalname: 'qg-result-v1-valid-all-fields.yaml',
        buffer: Buffer.from(YAML.stringify(qg_result_v1)),
      }

      expect(
        resultValidator.validate(
          multerFile as Express.Multer.File,
          'invalid_metadata'
        )
      ).rejects.toThrow()
    }
  )

  it.each([
    {
      name: 1,
      version: '1.16.0',
      date: '2024-09-19 15:21',
      toolVersion: '0.11.1-dev-2024-09-19_11-15-12-401a1bb',
    },
    {
      name: '1',
      version: [],
      date: '2024-09-19 15:21',
      toolVersion: '0.11.1-dev-2024-09-19_11-15-12-401a1bb',
    },
    {
      name: '1',
      version: '1.16.0',
      date: 2024,
      toolVersion: '0.11.1-dev-2024-09-19_11-15-12-401a1bb',
    },
    {
      name: '1',
      version: '1.16.0',
      date: '2024-09-19 15:21',
      toolVersion: true,
    },
  ])(
    'run gq-config validator with incorrectly formatted header; expect to throw error',
    async (invalidHeader: any) => {
      qg_result_v1.header = invalidHeader

      const multerFile: Partial<Express.Multer.File> = {
        originalname: 'qg-result-v1-valid-all-fields.yaml',
        buffer: Buffer.from(YAML.stringify(qg_result_v1)),
      }

      expect(
        resultValidator.validate(
          multerFile as Express.Multer.File,
          'invalid_header'
        )
      ).rejects.toThrow()
    }
  )

  it.each(['abc', 'PURPLE', 1, true])(
    'run gq-config validator with incorrectly formatted overallStatus; expect to throw error',
    async (invalidOverallStatus: any) => {
      qg_result_v1.overallStatus = invalidOverallStatus

      const multerFile: Partial<Express.Multer.File> = {
        originalname: 'qg-result-v1-valid-all-fields.yaml',
        buffer: Buffer.from(YAML.stringify(qg_result_v1)),
      }

      expect(
        resultValidator.validate(
          multerFile as Express.Multer.File,
          'invalid_overallStatus'
        )
      ).rejects.toThrow()
    }
  )

  it.each([
    {
      'counted-checks': '1',
      'counted-automated-checks': 1,
      'counted-manual-check': 0,
      'counted-unanswered-checks': 0,
      'counted-skipped-checks': 0,
      'degree-of-automation': 100,
      'degree-of-completion': 100,
    },
    {
      'counted-checks': 1,
      'counted-automated-checks': 'abc',
      'counted-manual-check': 0,
      'counted-unanswered-checks': 0,
      'counted-skipped-checks': 0,
      'degree-of-automation': 100,
      'degree-of-completion': 100,
    },
    {
      'counted-checks': 1,
      'counted-automated-checks': 1,
      'counted-manual-check': '',
      'counted-unanswered-checks': 0,
      'counted-skipped-checks': 0,
      'degree-of-automation': 100,
      'degree-of-completion': 100,
    },
    {
      'counted-checks': 1,
      'counted-automated-checks': 1,
      'counted-manual-check': 0,
      'counted-unanswered-checks': true,
      'counted-skipped-checks': 0,
      'degree-of-automation': 100,
      'degree-of-completion': 100,
    },
    {
      'counted-checks': 1,
      'counted-automated-checks': 1,
      'counted-manual-check': 0,
      'counted-unanswered-checks': 0,
      'counted-skipped-checks': [],
      'degree-of-automation': 100,
      'degree-of-completion': 100,
    },
    {
      'counted-checks': 1,
      'counted-automated-checks': 1,
      'counted-manual-check': '',
      'counted-unanswered-checks': 0,
      'counted-skipped-checks': 0,
      'degree-of-automation': {},
      'degree-of-completion': 100,
    },
    {
      'counted-checks': 1,
      'counted-automated-checks': 1,
      'counted-manual-check': '',
      'counted-unanswered-checks': 0,
      'counted-skipped-checks': 0,
      'degree-of-automation': 100,
      'degree-of-completion': '2024-09-19 15:21',
    },
    {
      'wrong-name': 1,
      'counted-automated-checks': 1,
      'counted-manual-check': '',
      'counted-unanswered-checks': 0,
      'counted-skipped-checks': 0,
      'degree-of-automation': 100,
      'degree-of-completion': 100,
    },
  ])(
    'run gq-config validator with incorrectly formatted statistics; expect to throw error',
    async (invalidStatistics: any) => {
      qg_result_v1.statistics = invalidStatistics

      const multerFile: Partial<Express.Multer.File> = {
        originalname: 'qg-result-v1-valid-all-fields.yaml',
        buffer: Buffer.from(YAML.stringify(qg_result_v1)),
      }

      expect(
        resultValidator.validate(
          multerFile as Express.Multer.File,
          'invalid_header'
        )
      ).rejects.toThrow()
    }
  )

  it.each([
    {
      title: 1,
      text: 'text',
      status: 'GREEN',
    },
    {
      title: 'title',
      text: 345,
      status: 'YELLOW',
    },
    {
      title: 'TITLE',
      text: '',
      status: 'ORANGE',
    },
  ])(
    'run gq-config validator with incorrectly formatted chapter; expect to throw error',
    async (invalidChecks: any) => {
      qg_result_v1.chapters[3].title = invalidChecks.title
      qg_result_v1.chapters[3].text = invalidChecks.text
      qg_result_v1.chapters[3].status = invalidChecks.status

      const multerFile: Partial<Express.Multer.File> = {
        originalname: 'qg-result-v1-valid-all-fields.yaml',
        buffer: Buffer.from(YAML.stringify(qg_result_v1)),
      }

      expect(
        resultValidator.validate(
          multerFile as Express.Multer.File,
          'invalid_chapter'
        )
      ).rejects.toThrow()
    }
  )

  it.each([
    {
      title: 456,
      text: 'text',
      status: 'GREEN',
    },
    {
      title: 'title',
      text: [],
      status: 'YELLOW',
    },
    {
      title: 'TITLE',
      text: '',
      status: 'FAILURE',
    },
  ])(
    'run gq-config validator with incorrectly formatted requirements; expect to throw error',
    async (invalidRequirements: any) => {
      qg_result_v1.chapters[3].requirements[3.4].title =
        invalidRequirements.title
      qg_result_v1.chapters[3].requirements[3.4].text = invalidRequirements.text
      qg_result_v1.chapters[3].requirements[3.4].status =
        invalidRequirements.status

      const multerFile: Partial<Express.Multer.File> = {
        originalname: 'qg-result-v1-valid-all-fields.yaml',
        buffer: Buffer.from(YAML.stringify(qg_result_v1)),
      }

      expect(
        resultValidator.validate(
          multerFile as Express.Multer.File,
          'invalid_requirements'
        )
      ).rejects.toThrow()
    }
  )

  it.each([
    {
      title: 456,
      status: 'GREEN',
      type: 'manual',
    },
    {
      title: 'title',
      status: '',
      type: 'Automation',
    },
    {
      title: 'TITLE',
      status: 'FAILED',
      type: 'wrong type',
    },
  ])(
    'run gq-config validator with incorrectly formatted checks; expect to throw error',
    async (invalidChecks: any) => {
      qg_result_v1.chapters[3].requirements[3.4].checks[1.1].title =
        invalidChecks.title
      qg_result_v1.chapters[3].requirements[3.4].checks[1.1].status =
        invalidChecks.status
      qg_result_v1.chapters[3].requirements[3.4].checks[1.1].type =
        invalidChecks.type

      const multerFile: Partial<Express.Multer.File> = {
        originalname: 'qg-result-v1-valid-all-fields.yaml',
        buffer: Buffer.from(YAML.stringify(qg_result_v1)),
      }

      expect(
        resultValidator.validate(
          multerFile as Express.Multer.File,
          'invalid_checks'
        )
      ).rejects.toThrow()
    }
  )

  it.each([
    {
      autopilot: 1,
      status: 'GREEN',
      reason: 'Reason text',
      outputs: { abc: 'xyz' },
    },
    {
      status: 'PURPLE',
      reason: 'Reason text',
      outputs: { abc: 'xyz', someField: 'abc' },
    },
    {
      autopilot: 'autopilot',
      status: 'GREEN',
      reason: 123,
    },
    {
      autopilot: 'text',
      status: 'GREEN',
      reason: 'Reason text',
      outputs: 0,
    },
  ])(
    'run gq-config validator with incorrectly formatted evaluation; expect to throw error',
    async (invalidEvaluation: any) => {
      qg_result_v1.chapters[3].requirements[3.4].checks[1.1].evaluation.autopilot =
        invalidEvaluation.autopilot
      qg_result_v1.chapters[3].requirements[3.4].checks[1.1].evaluation.status =
        invalidEvaluation.status
      qg_result_v1.chapters[3].requirements[3.4].checks[1.1].evaluation.reason =
        invalidEvaluation.reason
      qg_result_v1.chapters[3].requirements[3.4].checks[1.1].evaluation.outputs =
        invalidEvaluation.outputs

      const multerFile: Partial<Express.Multer.File> = {
        originalname: 'qg-result-v1-valid-all-fields.yaml',
        buffer: Buffer.from(YAML.stringify(qg_result_v1)),
      }

      expect(
        resultValidator.validate(
          multerFile as Express.Multer.File,
          'invalid_evaluation'
        )
      ).rejects.toThrow()
    }
  )

  it.each([
    {
      criterion: 1,
      fulfilled: true,
      justification: 'text',
      metadata: { abc: 'xyz' },
    },
    {
      criterion: 'text',
      fulfilled: 'not boolean',
      justification: '',
      metadata: { abc: 'xyz', xyz: 'text' },
    },
    {
      criterion: 'text',
      fulfilled: false,
      justification: 54,
    },
    {
      criterion: 'text',
      fulfilled: true,
      justification: 'text',
      metadata: { abc: 2 },
    },
  ])(
    'run gq-config validator with incorrectly formatted results; expect to throw error',
    async (invalidResult: any) => {
      qg_result_v1.chapters[3].requirements[3.4].checks[1.1].evaluation.results[0].criterion =
        invalidResult.criterion
      qg_result_v1.chapters[3].requirements[3.4].checks[1.1].evaluation.results[0].fulfilled =
        invalidResult.fulfilled
      qg_result_v1.chapters[3].requirements[3.4].checks[1.1].evaluation.results[0].justification =
        invalidResult.justification
      qg_result_v1.chapters[3].requirements[3.4].checks[1.1].evaluation.results[0].metadata =
        invalidResult.metadata

      const multerFile: Partial<Express.Multer.File> = {
        originalname: 'qg-result-v1-valid-all-fields.yaml',
        buffer: Buffer.from(YAML.stringify(qg_result_v1)),
      }

      expect(
        resultValidator.validate(
          multerFile as Express.Multer.File,
          'invalid_result'
        )
      ).rejects.toThrow()
    }
  )

  it.each([
    {
      logs: 54,
      errorLogs: ['abc', 'xyz'],
      evidencePath: 'text',
      exitCode: 1,
    },
    {
      logs: ['array', 'of', 'string'],
      errorLogs: true,
      evidencePath: 'path',
      exitCode: 1,
    },
    {
      errorLogs: ['abc', 'xyz'],
      evidencePath: 2,
      exitCode: 1,
    },
    {
      logs: ['array', 'of', 'string'],
      evidencePath: 'text',
      exitCode: '12',
    },
  ])(
    'run gq-config validator with incorrectly formatted execution; expect to throw error',
    async (invalidExecution: any) => {
      qg_result_v1.finalize.execution = invalidExecution

      const multerFile: Partial<Express.Multer.File> = {
        originalname: 'qg-result-v1-valid-all-fields.yaml',
        buffer: Buffer.from(YAML.stringify(qg_result_v1)),
      }

      expect(
        resultValidator.validate(
          multerFile as Express.Multer.File,
          'invalid_result'
        )
      ).rejects.toThrow()
    }
  )

  it.each([
    {
      title: 1,
      id: 'xyz',
      depends: ['abc', 'xyz'],
      logs: ['log1', 'log2'],
      warnings: ['warning1'],
      messages: ['message1', 'message2', 'message3'],
      configFiles: ['fil1', 'file2'],
      outputDir: 'dir',
      resultFile: 'result',
      inputDirs: ['inputDir1', 'indputDir2'],
      exitCode: 1,
    },
    {
      title: 'title',
      id: 0,
      depends: ['abc', 'xyz'],
      logs: ['log1', 'log2'],
      warnings: ['warning1'],
      messages: ['message1', 'message2', 'message3'],
      configFiles: ['fil1', 'file2'],
      outputDir: 'dir',
      resultFile: 'result',
      inputDirs: ['inputDir1', 'indputDir2'],
      exitCode: 1,
    },
    {
      id: 'id',
      depends: ['abc', 1],
      logs: ['log1', 'log2'],
      warnings: ['warning1'],
      messages: ['message1', 'message2', 'message3'],
      configFiles: ['fil1', 'file2'],
      outputDir: 'dir',
      resultFile: 'result',
      inputDirs: ['inputDir1', 'indputDir2'],
      exitCode: 1,
    },
    {
      id: '0',
      logs: 4,
      warnings: ['warning1'],
      messages: ['message1', 'message2', 'message3'],
      configFiles: ['fil1', 'file2'],
      outputDir: 'dir',
      resultFile: 'result',
      inputDirs: ['inputDir1', 'indputDir2'],
      exitCode: 1,
    },
    {
      id: 0,
      logs: ['log1', 'log2'],
      warnings: [12.5],
      messages: ['message1', 'message2', true],
      configFiles: ['fil1', 'file2'],
      outputDir: 'dir',
      resultFile: 'result',
      inputDirs: ['inputDir1', 'indputDir2'],
      exitCode: 1,
    },
    {
      id: 0,
      logs: ['log1', 'log2'],
      messages: ['message1', 'message2', true],
      configFiles: ['fil1', 'file2'],
      outputDir: 'dir',
      resultFile: 'result',
      inputDirs: ['inputDir1', 'indputDir2'],
      exitCode: 1,
    },
    {
      id: 0,
      logs: ['log1', 'log2'],
      configFiles: [1, 2],
      outputDir: 'dir',
      resultFile: 'result',
      inputDirs: ['inputDir1', 'indputDir2'],
      exitCode: 1,
    },
    {
      id: 0,
      logs: ['log1', 'log2'],
      outputDir: {},
      resultFile: 'result',
      inputDirs: ['inputDir1', 'indputDir2'],
      exitCode: 1,
    },
    {
      id: 0,
      logs: ['log1', 'log2'],
      outputDir: 'dir',
      resultFile: [],
      inputDirs: ['inputDir1', 'indputDir2'],
      exitCode: 1,
    },
    {
      id: 0,
      logs: ['log1', 'log2'],
      outputDir: 'dir',
      resultFile: 'result',
      inputDirs: 'inputDir1',
      exitCode: 1,
    },
    {
      id: 0,
      logs: ['log1', 'log2'],
      outputDir: 'dir',
      resultFile: 'result',
      exitCode: '6',
    },
  ])(
    'run gq-config validator with incorrectly formatted steps(v2); expect to throw error',
    async (invalidSteps: any) => {
      qg_result_v2.chapters[1].requirements[1].checks[1].autopilots[0].steps[0] =
        invalidSteps

      const multerFile: Partial<Express.Multer.File> = {
        originalname: 'qg-result-v1-valid-all-fields.yaml',
        buffer: Buffer.from(YAML.stringify(qg_result_v2)),
      }

      expect(
        resultValidator.validate(
          multerFile as Express.Multer.File,
          'invalid_steps'
        )
      ).rejects.toThrow()
    }
  )

  it.each([
    {
      logs: [1, 2, 3],
      warnings: ['warning1'],
      messages: ['message1', 'message2', 'message3'],
      configFiles: ['fil1', 'file2'],
      exitCode: 1,
    },
    {
      warnings: {},
      messages: ['message1', 'message2', 'message3'],
      configFiles: ['fil1', 'file2'],
      exitCode: 1,
    },
    {
      messages: false,
      configFiles: ['fil1', 'file2'],
      exitCode: 1,
    },
    {
      configFiles: [['fil1', 'file2']],
      exitCode: 1,
    },
    {
      exitCode: [1, 2],
    },
  ])(
    'run gq-config validator with incorrectly formatted finalize(v2); expect to throw error',
    async (invalidFinalize: any) => {
      qg_result_v2.finalize = invalidFinalize

      const multerFile: Partial<Express.Multer.File> = {
        originalname: 'qg-result-v1-valid-all-fields.yaml',
        buffer: Buffer.from(YAML.stringify(qg_result_v2)),
      }

      expect(
        resultValidator.validate(
          multerFile as Express.Multer.File,
          'invalid_finalize'
        )
      ).rejects.toThrow()
    }
  )
})
