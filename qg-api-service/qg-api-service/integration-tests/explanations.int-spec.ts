import { HttpStatus } from '@nestjs/common'
import { DefaultBodyType, MockedRequest } from 'msw'
import { SetupServer, setupServer } from 'msw/node'
import { Readable } from 'stream'
import supertest from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RunService } from '../src/namespace/run/run.service'
import { OpenAIService } from '../src/gp-services/openai.service'
import { handlers } from './mocks'
import { NamespaceTestEnvironment, NestTestingApp, NestUtil } from './util'
import path from 'path'
import { readFile } from 'fs/promises'
import { Run, RunResult, RunStatus } from '../src/namespace/run/run.entity'
import { Prompt, getTokenLength } from '../src/gp-services/openai.utils'
import { ChatCompletion } from 'openai/resources'
import { SecretStorage } from '../src/namespace/secret/secret-storage.service'
import {
  MinIOStoreImpl,
  BlobStore,
} from '../src/namespace/workflow/minio.service'
import { FileContentEntity } from '../src/namespace/configs/config.entity'
import { getRepositoryToken } from '@nestjs/typeorm'

describe('Explanations', () => {
  let nestTestingApp: NestTestingApp
  let allRequests: MockedRequest<DefaultBodyType>[] = []
  let server: SetupServer

  let apiToken
  let testNamespace: NamespaceTestEnvironment

  const openai_testYAML = {
    filepath: path.join(__dirname, 'mocks', 'openai-test.yaml'),
    filename: 'openai-test.yaml',
  }

  const openai_testJSON = {
    filepath: path.join(__dirname, 'mocks', 'openai-test.json'),
    filename: 'openai-test.json',
  }

  const onekTokens = {
    filepath: path.join(__dirname, 'mocks', '1k.yaml'),
    filename: '1k.yaml',
  }
  const onekTokens_2 = {
    filepath: path.join(__dirname, 'mocks', '1k.yaml'),
    filename: '1k_2.yaml',
  }

  const fourkTokens = {
    filepath: path.join(__dirname, 'mocks', '4k.yaml'),
    filename: '4k.yaml',
  }
  const fourkTokens_2 = {
    filepath: path.join(__dirname, 'mocks', '4k.yaml'),
    filename: '4k_2.yaml',
  }
  const qg_config_large = {
    filepath: path.join(__dirname, 'mocks', 'qg-config-large-openai.yaml'),
    filename: 'qg-config.yaml',
  }

  const qg_config_small = {
    filepath: path.join(__dirname, 'mocks', 'qg-config-small-openai.yaml'),
    filename: 'qg-config.yaml',
  }

  const files = [
    openai_testYAML,
    openai_testJSON,
    onekTokens,
    onekTokens_2,
    fourkTokens,
    fourkTokens_2,
    qg_config_large,
    qg_config_small,
  ]

  const chapter = '5'
  const requirement = '5.1'
  const check = '1'

  beforeEach(async () => {
    const nestUtil = new NestUtil()
    nestTestingApp = await nestUtil.startNestApplication()
    const databaseContent = await nestUtil.initDatabaseContent()
    testNamespace = databaseContent.testNamespace

    apiToken = await nestTestingApp.utils.getUserToken(testNamespace.users[0])

    server = setupServer(...handlers)
    server.listen()
    allRequests = []
    server.events.on('request:start', (req) => {
      console.log('MSW attached:')
      if (!req.url.host.match(/localhost|127\.0\.0\.1/)) {
        allRequests.push(req)
      }
    })

    vi.spyOn(
      nestTestingApp.testingModule.get<OpenAIService>(OpenAIService),
      'sendMessages'
    ).mockImplementation(async (prompt: Prompt[]): Promise<ChatCompletion> => {
      const tokenLength = await getTokenLength(prompt[0].content)

      if (tokenLength > 8192) {
        Promise.reject(new Error('Token length exceeded'))
      }
      return Promise.resolve({
        choices: [{ message: { content: 'Mock OpenAI Response' } }],
      } as ChatCompletion)
    })

    const resultFile = path.join(
      __dirname,
      'mocks',
      'qg-result-10-findings-red-status.yaml'
    )
    vi.spyOn(
      nestTestingApp.testingModule.get<MinIOStoreImpl>(BlobStore),
      'downloadResult'
    ).mockImplementation(async (): Promise<Readable> => {
      const buffer = await readFile(resultFile)
      const readableStream = new Readable({
        read() {
          this.push(buffer, 'utf-8')
          this.push(null)
        },
      })

      return Promise.resolve(readableStream)
    })

    vi.spyOn(
      nestTestingApp.testingModule.get(getRepositoryToken(FileContentEntity)),
      'findOneBy'
    ).mockImplementation(
      async (obj: {
        file: {
          filename: string
        }
      }): Promise<FileContentEntity> => {
        const file = files.find((file) => {
          return file.filename === obj.file.filename
        })
        return Promise.resolve({
          id: 1,
          filename: 'qg-config.yaml',
          content: await readFile(file.filepath),
          configId: 1,
        } as unknown as FileContentEntity)
      }
    )

    vi.spyOn(
      nestTestingApp.testingModule.get<SecretStorage>(SecretStorage),
      'getSecrets'
    ).mockImplementation(() => Promise.resolve({}))
    vi.spyOn(
      nestTestingApp.testingModule.get<MinIOStoreImpl>(BlobStore),
      'uploadConfig'
    ).mockImplementation(() => {
      return Promise.resolve()
    })
    vi.spyOn(
      nestTestingApp.testingModule.get<MinIOStoreImpl>(BlobStore),
      'fileExists'
    ).mockImplementation(() => Promise.resolve(true))

    vi.spyOn(
      nestTestingApp.testingModule.get<MinIOStoreImpl>(BlobStore),
      'downloadLogs'
    ).mockImplementation(() =>
      Promise.resolve('Cool logs\nOverall result: GREEN')
    )
  })

  afterEach(async () => {
    server.close()
    await nestTestingApp.app.close()
    vi.restoreAllMocks()
  })

  async function createConfiguration(
    files: {
      filepath: string
      filename: string
    }[]
  ): Promise<void> {
    const httpServer = await nestTestingApp.app.getHttpServer()

    const response = await supertest
      .agent(httpServer)
      .post(`/api/v1/namespaces/${testNamespace.namespace.id}/configs`)
      .send({ name: 'Explanations (Integration Test)' })
      .set('Authorization', `Bearer ${apiToken}`)
      .set('Content-Type', 'application/json')
      .expect(HttpStatus.CREATED)
    const configId = response.body.id

    for (const file of files) {
      const fileContent = await readFile(file.filepath)
      await supertest
        .agent(httpServer)
        .post(
          `/api/v1/namespaces/${testNamespace.namespace.id}/configs/${configId}/files`
        )
        .field('filename', file.filename)
        .attach('content', fileContent, {
          filename: file.filename,
          contentType: 'multipart/form-data',
        })
        .set('Authorization', `Bearer ${apiToken}`)
        .expect(HttpStatus.CREATED)
    }
    return configId
  }

  async function postRun(body: any): Promise<number> {
    const httpServer = await nestTestingApp.app.getHttpServer()

    const response = await supertest
      .agent(httpServer)
      .post(`/api/v1/namespaces/${testNamespace.namespace.id}/runs`)
      .send(body)
      .set('Authorization', `Bearer ${apiToken}`)
      .expect(HttpStatus.ACCEPTED)
    expect(
      response.body.id,
      `The id of created run does not exist`
    ).toBeDefined()
    expect(
      response.headers.location.endsWith(`${response.body.id}`),
      `The location header of created run is not as expected`
    ).toBeTruthy()
    expect(
      response.body.status,
      `The status of created run is not as expected, it is ${response.body.status}`
    ).oneOf([RunStatus.Running, RunStatus.Pending])
    expect(
      response.body.config,
      `The config ref of created run is not as expected, it is ${response.body.config}`
    ).match(/^.*\/namespaces\/\d+\/configs\/\d+$/)

    return response.body.id
  }
  async function awaitPending(runId: number): Promise<void> {
    let run = await getRun(runId)
    while (run.body.status === RunStatus.Pending) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      run = await getRun(runId)
    }
  }

  async function getRun(runId: number): Promise<any> {
    return await supertest
      .agent(nestTestingApp.app.getHttpServer())
      .get(`/api/v1/namespaces/${testNamespace.namespace.id}/runs/${runId}`)
      .set('Authorization', `Bearer ${apiToken}`)
      .expect(HttpStatus.OK)
  }

  async function completeRun(runId: number, overallResult: RunResult) {
    await awaitPending(runId)
    await getRun(runId)

    // mark run as completed
    await nestTestingApp.repositories.runRepository
      .createQueryBuilder()
      .update(Run)
      .set({
        status: RunStatus.Completed,
        overallResult: overallResult,
        completionTime: new Date(),
      })
      .where('id = :id', { id: runId })
      .execute()
  }

  describe(
    'GET explainer under token limit',
    async () => {
      const files = [openai_testYAML, openai_testJSON, qg_config_small]

      it('should be defined', async () => {
        const body = {
          configId: await createConfiguration(files),
        }
        const runId = await postRun(body)
        await completeRun(runId, RunResult.Green)

        const httpServer = nestTestingApp.app.getHttpServer()
        const result = await supertest
          .agent(httpServer)
          .get(
            `/api/v1/namespaces/${testNamespace.namespace.id}/explainer?runId=${runId}&chapter=${chapter}&requirement=${requirement}&check=${check}`
          )
          .set('Authorization', `Bearer ${apiToken}`)
          .set('Accept', 'application/json')

        expect(result.status).toBe(HttpStatus.OK)
        expect(result.body.explanation).toBeDefined()
      })

      it('should throw NotFoundException when QG config not found', async () => {
        const runId = 10

        vi.spyOn(
          nestTestingApp.testingModule.get<RunService>(RunService),
          'getResult'
        ).mockRejectedValue(new Error('Run not found'))

        const httpServer = nestTestingApp.app.getHttpServer()
        const result = await supertest
          .agent(httpServer)
          .get(
            `/api/v1/namespaces/${testNamespace.namespace.id}/explainer?runId=${runId}&chapter=${chapter}&requirement=${requirement}&check=${check}`
          )
          .set('Authorization', `Bearer ${apiToken}`)
          .set('Accept', 'application/json')

        expect(result.status).toBe(HttpStatus.NOT_FOUND)
      })

      it('should throw UnprocessableEntityException when YAML data import fails', async () => {
        const body = {
          configId: await createConfiguration([
            {
              filepath: path.join(__dirname, 'mocks', '1k.yaml'),
              filename: '1k.yaml',
            },
          ]),
        }
        const runId = await postRun(body)
        await completeRun(runId, RunResult.Green)

        vi.spyOn(
          nestTestingApp.testingModule.get<RunService>(RunService),
          'getResult'
        ).mockImplementationOnce(() => {
          return Promise.resolve(Readable.from(['Some invalid data']))
        })

        const httpServer = nestTestingApp.app.getHttpServer()
        const result = await supertest
          .agent(httpServer)
          .get(
            `/api/v1/namespaces/${testNamespace.namespace.id}/explainer?runId=${runId}&chapter=${chapter}&requirement=${requirement}&check=${check}`
          )
          .set('Authorization', `Bearer ${apiToken}`)
          .set('Accept', 'application/json')

        expect(result.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY)
      })

      it('should throw UnprocessableEntityException when a non-existing chapter is selected from the QG result', async () => {
        const body = {
          configId: await createConfiguration(files),
        }
        const runId = await postRun(body)
        await completeRun(runId, RunResult.Green)

        const chapter = 'non-exisiting-chapter'

        const httpServer = nestTestingApp.app.getHttpServer()
        const result = await supertest
          .agent(httpServer)
          .get(
            `/api/v1/namespaces/${testNamespace.namespace.id}/explainer?runId=${runId}&chapter=${chapter}&requirement=${requirement}&check=${check}`
          )
          .set('Authorization', `Bearer ${apiToken}`)
          .set('Accept', 'application/json')

        expect(result.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY)
      })

      it('should throw UnprocessableEntityException when a non-existing requirement is selected from the QG result', async () => {
        const body = {
          configId: await createConfiguration(files),
        }
        const runId = await postRun(body)
        await completeRun(runId, RunResult.Green)

        const requirement = 'non-exisiting-requirement'

        const httpServer = nestTestingApp.app.getHttpServer()
        const result = await supertest
          .agent(httpServer)
          .get(
            `/api/v1/namespaces/${testNamespace.namespace.id}/explainer?runId=${runId}&chapter=${chapter}&requirement=${requirement}&check=${check}`
          )
          .set('Authorization', `Bearer ${apiToken}`)
          .set('Accept', 'application/json')

        expect(result.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY)
      })

      it('should throw UnprocessableEntityException when a non-existing check is selected from the QG result', async () => {
        const body = {
          configId: await createConfiguration(files),
        }
        const runId = await postRun(body)
        await completeRun(runId, RunResult.Green)

        const check = 'non-exisiting-check'

        const httpServer = nestTestingApp.app.getHttpServer()
        const result = await supertest
          .agent(httpServer)
          .get(
            `/api/v1/namespaces/${testNamespace.namespace.id}/explainer?runId=${runId}&chapter=${chapter}&requirement=${requirement}&check=${check}`
          )
          .set('Authorization', `Bearer ${apiToken}`)
          .set('Accept', 'application/json')

        expect(result.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY)
      })

      it('should not exceed the token limit', async () => {
        const files = [
          qg_config_large,
          openai_testYAML,
          onekTokens,
          openai_testJSON,
          fourkTokens,
          onekTokens_2,
          fourkTokens_2,
        ]
        const body = {
          configId: await createConfiguration(files),
        }
        const runId = await postRun(body)
        await completeRun(runId, RunResult.Green)

        const httpServer = nestTestingApp.app.getHttpServer()
        const result = await supertest
          .agent(httpServer)
          .get(
            `/api/v1/namespaces/${testNamespace.namespace.id}/explainer?runId=${runId}&chapter=${chapter}&requirement=${requirement}&check=${check}`
          )
          .set('Authorization', `Bearer ${apiToken}`)
          .set('Accept', 'application/json')

        expect(result.status).toBe(HttpStatus.OK)
        expect(result.body.explanation).toBeDefined()
      })
    },
    {
      timeout: 30000,
    }
  )
})
