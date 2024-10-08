import { HttpStatus } from '@nestjs/common'
import { readFile } from 'fs/promises'
import { DefaultBodyType, MockedRequest } from 'msw'
import { SetupServer, setupServer } from 'msw/node'
import * as path from 'path'
import { Readable } from 'stream'
import * as supertest from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Run, RunResult, RunStatus } from '../src/namespace/run/run.entity'
import { SecretStorage } from '../src/namespace/secret/secret-storage.service'
import {
  BlobStore,
  MinIOStoreImpl,
} from '../src/namespace/workflow/minio.service'
import { handlers } from './mocks'
import { NamespaceTestEnvironment, NestTestingApp, NestUtil } from './util'

describe('Metrics Controller', () => {
  let nestTestingApp: NestTestingApp
  let allRequests: MockedRequest<DefaultBodyType>[] = []
  let server: SetupServer

  let apiToken
  let testNamespace: NamespaceTestEnvironment

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
      if (!req.url.host.match(/localhost|127\.0\.0\.1/)) {
        allRequests.push(req)
      }
    })

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

  describe('GET findings', () => {
    it('should be defined', async () => {
      const httpServer = await nestTestingApp.app.getHttpServer()

      const result = await supertest
        .agent(httpServer)
        .get(
          `/api/v1/namespaces/${testNamespace.namespace.id}/metrics/findings?page=1&items=20&sortOrder=DESC&sortBy=count`
        )
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)

      expect(result.statusCode).toBe(HttpStatus.OK)
      expect(result.body.pagination).toBeDefined()
      expect(result.body.data).toBeDefined()
    })

    it('should return the number of findings matching the criteria', async () => {
      const expectedMetricsEntries = 10
      const expectedRuns = 1
      const expectedCount = 10
      const expectedDiff = 10

      const httpServer = await nestTestingApp.app.getHttpServer()
      const configFile = path.join(
        __dirname,
        'mocks',
        'qg-config-10-findings-red-status.yaml'
      )
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

      await checkMetricsDatabaseEntries(0)
      const body = {
        configId: await createConfiguration(configFile),
      }

      const runId = await postRun(body)
      await checkRunDatabaseEntry(runId)

      await completeRun(runId, RunResult.Red)
      await checkMetricsDatabaseEntries(runId * expectedMetricsEntries)

      const result = await supertest
        .agent(httpServer)
        .get(
          `/api/v1/namespaces/${testNamespace.namespace.id}/metrics/findings?page=1&items=20&sortOrder=ASC&sortBy=runId`
        )
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)

      expect(result.statusCode).toBe(HttpStatus.OK)
      expect(+result.body.pagination.totalCount).toBe(expectedRuns)
      expect(+result.body.data[runId - 1].count).toBe(expectedCount)
      expect(+result.body.data[runId - 1].diff).toBe(expectedDiff)
    })

    it('should return the number of findings in increasing quality scenario', async () => {
      const expectedEntries = 10
      const expectedCount = 4
      const expectedDiff = -6

      const httpServer = await nestTestingApp.app.getHttpServer()
      const configFile = path.join(
        __dirname,
        'mocks',
        'qg-config-10-findings-red-status.yaml'
      )
      let resultFile = path.join(
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

      await checkMetricsDatabaseEntries(0)
      const body = {
        configId: await createConfiguration(configFile),
      }

      // first run
      let runId = await postRun(body)
      await checkRunDatabaseEntry(runId)

      await completeRun(runId, RunResult.Red)
      await checkMetricsDatabaseEntries(runId * expectedEntries)

      // second run
      resultFile = path.join(
        __dirname,
        'mocks',
        'qg-result-4-findings-red-status.yaml'
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
      runId = await postRun(body)
      await checkRunDatabaseEntry(runId)

      await completeRun(runId, RunResult.Red)
      await checkMetricsDatabaseEntries(runId * expectedEntries)

      const result = await supertest
        .agent(httpServer)
        .get(
          `/api/v1/namespaces/${testNamespace.namespace.id}/metrics/findings?page=1&items=20&sortOrder=DESC&sortBy=runId`
        )
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)

      expect(result.statusCode).toBe(HttpStatus.OK)
      expect(+result.body.pagination.totalCount).toBe(runId)
      expect(+result.body.data[0].runId).toBe(runId)
      expect(+result.body.data[0].count).toBe(expectedCount)
      expect(+result.body.data[0].diff).toBe(expectedDiff)
    })

    it('should return number of findings in decreasing quality scenario', async () => {
      const expectedEntries = 10
      const expectedCount = 10
      const expectedDiff = 6

      const httpServer = await nestTestingApp.app.getHttpServer()
      const configFile = path.join(
        __dirname,
        'mocks',
        'qg-config-4-findings-red-status.yaml'
      )
      let resultFile = path.join(
        __dirname,
        'mocks',
        'qg-result-4-findings-red-status.yaml'
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

      await checkMetricsDatabaseEntries(0)
      const body = {
        configId: await createConfiguration(configFile),
      }

      // first run
      let runId = await postRun(body)
      await checkRunDatabaseEntry(runId)

      await completeRun(runId, RunResult.Red)
      await checkMetricsDatabaseEntries(runId * expectedEntries - expectedDiff)

      // second run
      resultFile = path.join(
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
      runId = await postRun(body)
      await checkRunDatabaseEntry(runId)

      await completeRun(runId, RunResult.Red)
      await checkMetricsDatabaseEntries(runId * expectedEntries - expectedDiff)

      const result = await supertest
        .agent(httpServer)
        .get(
          `/api/v1/namespaces/${testNamespace.namespace.id}/metrics/findings?page=1&items=20&sortOrder=DESC&sortBy=runId`
        )
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)

      expect(result.statusCode).toBe(HttpStatus.OK)
      expect(+result.body.pagination.totalCount).toBe(runId)
      expect(+result.body.data[0].runId).toBe(runId)
      expect(+result.body.data[0].count).toBe(expectedCount)
      expect(+result.body.data[0].diff).toBe(expectedDiff)
    })

    it('should return number of findings in between runs scenario', async () => {
      const expectedEntries = 10
      const expectedCount = 4
      const expectedDiff = -4
      const expectedManuallyResolvedCount = 8
      const expectedManuallyResolvedDiff = 8

      const httpServer = await nestTestingApp.app.getHttpServer()
      const configFile = path.join(
        __dirname,
        'mocks',
        'qg-config-10-findings-red-status.yaml'
      )
      let resultFile = path.join(
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

      await checkMetricsDatabaseEntries(0)
      const body = {
        configId: await createConfiguration(configFile),
      }

      // first run
      let runId = await postRun(body)
      await checkRunDatabaseEntry(runId)

      await completeRun(runId, RunResult.Red)
      await checkMetricsDatabaseEntries(runId * expectedEntries)

      // manually resolve 2 findings
      const manuallyResolvedRunId = runId
      const response = await supertest
        .agent(httpServer)
        .get(
          `/api/v1/namespaces/${testNamespace.namespace.id}/findings?page=1&items=20&sortOrder=DESC&sortBy=id`
        )
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)

      const findings: any[] = response.body.data

      await supertest
        .agent(httpServer)
        .patch(
          `/api/v1/namespaces/${testNamespace.namespace.id}/findings/${
            findings.filter(
              (item) =>
                item.chapter === '1' &&
                item.requirement === '1' &&
                item.check === '1' &&
                item.justification === 'I am the reason 1'
            )[0].id
          }`
        )
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)
        .send({
          status: 'resolved',
          resolver: testNamespace.users[2].id,
          resolvedDate: new Date().toISOString(),
        })
      await supertest
        .agent(httpServer)
        .patch(
          `/api/v1/namespaces/${testNamespace.namespace.id}/findings/${
            findings.filter(
              (item) =>
                item.chapter === '1' &&
                item.requirement === '1' &&
                item.check === '1' &&
                item.justification === 'I am the reason 2'
            )[0].id
          }`
        )
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)
        .send({
          status: 'resolved',
          resolver: testNamespace.users[2].id,
          resolvedDate: new Date().toISOString(),
        })

      const manuallyResolvedResult = await supertest
        .agent(httpServer)
        .get(
          `/api/v1/namespaces/${testNamespace.namespace.id}/metrics/findings?page=1&items=20&sortOrder=DESC&sortBy=runId`
        )
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)

      // second run
      resultFile = path.join(
        __dirname,
        'mocks',
        'qg-result-4-findings-red-status.yaml'
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
      runId = await postRun(body)
      await checkRunDatabaseEntry(runId)

      await completeRun(runId, RunResult.Red)
      await checkMetricsDatabaseEntries(runId * expectedEntries)

      const result = await supertest
        .agent(httpServer)
        .get(
          `/api/v1/namespaces/${testNamespace.namespace.id}/metrics/findings?page=1&items=20&sortOrder=DESC&sortBy=runId`
        )
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)

      expect(manuallyResolvedResult.statusCode).toBe(HttpStatus.OK)
      expect(+manuallyResolvedResult.body.pagination.totalCount).toBe(
        manuallyResolvedRunId
      )
      expect(+manuallyResolvedResult.body.data[0].runId).toBe(
        manuallyResolvedRunId
      )
      expect(+manuallyResolvedResult.body.data[0].count).toBe(
        expectedManuallyResolvedCount
      )
      expect(+manuallyResolvedResult.body.data[0].diff).toBe(
        expectedManuallyResolvedDiff
      )

      expect(result.statusCode).toBe(HttpStatus.OK)
      expect(+result.body.pagination.totalCount).toBe(runId)
      expect(+result.body.data[0].runId).toBe(runId)
      expect(+result.body.data[0].count).toBe(expectedCount)
      expect(+result.body.data[0].diff).toBe(expectedDiff)
    })

    it('should return the number of findings in two consecutive equal RED scenarios', async () => {
      const expectedEntries = 10
      const expectedCount = 10
      const expectedDiff = 0

      const httpServer = await nestTestingApp.app.getHttpServer()
      const configFile = path.join(
        __dirname,
        'mocks',
        'qg-config-10-findings-red-status.yaml'
      )
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

      await checkMetricsDatabaseEntries(0)
      const body = {
        configId: await createConfiguration(configFile),
      }

      // first run
      let runId = await postRun(body)
      await checkRunDatabaseEntry(runId)

      await completeRun(runId, RunResult.Red)
      await checkMetricsDatabaseEntries(runId * expectedEntries)

      // second run
      runId = await postRun(body)
      await checkRunDatabaseEntry(runId)

      await completeRun(runId, RunResult.Red)
      await checkMetricsDatabaseEntries(2 * expectedEntries)

      const result = await supertest
        .agent(httpServer)
        .get(
          `/api/v1/namespaces/${testNamespace.namespace.id}/metrics/findings?page=1&items=20&sortOrder=DESC&sortBy=runId`
        )
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)

      expect(result.statusCode).toBe(HttpStatus.OK)
      expect(+result.body.pagination.totalCount).toBe(runId)
      expect(+result.body.data[0].runId).toBe(runId)
      expect(+result.body.data[0].count).toBe(expectedCount)
      expect(+result.body.data[0].diff).toBe(expectedDiff)
    })

    it('should return the number of findings in two consecutive GREEN scenarios', async () => {
      const expectedEntries = 10
      const expectedCount = 0
      const expectedDiff = 0

      const httpServer = await nestTestingApp.app.getHttpServer()
      const configFile = path.join(
        __dirname,
        'mocks',
        'qg-config-10-findings-red-status.yaml'
      )
      let resultFile = path.join(
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

      await checkMetricsDatabaseEntries(0)
      const body = {
        configId: await createConfiguration(configFile),
      }

      // first run - register new findings
      let runId = await postRun(body)
      await checkRunDatabaseEntry(runId)

      await completeRun(runId, RunResult.Red)
      await checkMetricsDatabaseEntries(runId * expectedEntries)

      // second run - first GREEN scenario
      resultFile = path.join(
        __dirname,
        'mocks',
        'qg-result-0-findings-green-status.yaml'
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
      runId = await postRun(body)
      await checkRunDatabaseEntry(runId)

      await completeRun(runId, RunResult.Green)
      await checkMetricsDatabaseEntries(runId * expectedEntries)

      // third run - second GREEN scenario
      resultFile = path.join(
        __dirname,
        'mocks',
        'qg-result-0-findings-green-status.yaml'
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
      runId = await postRun(body)
      await checkRunDatabaseEntry(runId)

      await completeRun(runId, RunResult.Green)
      await checkMetricsDatabaseEntries(runId * expectedEntries)

      const result = await supertest
        .agent(httpServer)
        .get(
          `/api/v1/namespaces/${testNamespace.namespace.id}/metrics/findings?page=1&items=20&sortOrder=DESC&sortBy=runId`
        )
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)

      expect(result.statusCode).toBe(HttpStatus.OK)
      expect(+result.body.pagination.totalCount).toBe(runId)
      expect(+result.body.data[0].runId).toBe(runId)
      expect(+result.body.data[0].count).toBe(expectedCount)
      expect(+result.body.data[0].diff).toBe(expectedDiff)
    })

    it('should return no findings information if none were ever created', async () => {
      const expectedEntries = 0

      const httpServer = await nestTestingApp.app.getHttpServer()
      const configFile = path.join(
        __dirname,
        'mocks',
        'qg-config-0-findings-green-status.yaml'
      )
      const resultFile = path.join(
        __dirname,
        'mocks',
        'qg-result-0-findings-green-status.yaml'
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

      await checkMetricsDatabaseEntries(0)
      const body = {
        configId: await createConfiguration(configFile),
      }

      // first run - no Findings
      let runId = await postRun(body)
      runId = await postRun(body)
      await checkRunDatabaseEntry(runId)

      await completeRun(runId, RunResult.Green)
      await checkMetricsDatabaseEntries(runId * expectedEntries)

      // second run - no Findings
      runId = await postRun(body)
      await checkRunDatabaseEntry(runId)

      await completeRun(runId, RunResult.Green)
      await checkMetricsDatabaseEntries(runId * expectedEntries)

      const result = await supertest
        .agent(httpServer)
        .get(
          `/api/v1/namespaces/${testNamespace.namespace.id}/metrics/findings?page=1&items=20&sortOrder=DESC&sortBy=runId`
        )
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)

      expect(result.statusCode).toBe(HttpStatus.OK)
      expect(+result.body.pagination.totalCount).toBe(0)
      expect(+result.body.data.length).toBe(0)
    })
  })

  describe('GET findingsInRange', () => {
    it('should be defined', async () => {
      const httpServer = await nestTestingApp.app.getHttpServer()

      const result = await supertest
        .agent(httpServer)
        .get(
          `/api/v1/namespaces/${testNamespace.namespace.id}/metrics/findingsInRange?page=1&items=20&sortOrder=ASC&sortBy=runId&startRange=1970-01-01%2000%3A00%3A00&endRange=2038-01-19%2003%3A14%3A07`
        )
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)

      expect(result.statusCode).toBe(HttpStatus.OK)
      expect(result.body.pagination).toBeDefined()
      expect(result.body.data).toBeDefined()
    })

    it('should return number of findings matching the date range', async () => {
      const expectedEntries = 10
      const expectedCount = 10
      const expectedDiff = 0

      const httpServer = await nestTestingApp.app.getHttpServer()
      const configFile = path.join(
        __dirname,
        'mocks',
        'qg-config-10-findings-red-status.yaml'
      )
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

      await checkMetricsDatabaseEntries(0)
      const body = {
        configId: await createConfiguration(configFile),
      }

      // first run
      let runId = await postRun(body)
      await checkRunDatabaseEntry(runId)

      await completeRun(runId, RunResult.Red)
      await checkMetricsDatabaseEntries(runId * expectedEntries)

      // second run
      const startDate = new Date().toISOString()
      const endDate = new Date('2038-01-19 03:14:07').toISOString()

      runId = await postRun(body)
      await checkRunDatabaseEntry(runId)

      await completeRun(runId, RunResult.Red)
      await checkMetricsDatabaseEntries(runId * expectedEntries)

      const result = await supertest
        .agent(httpServer)
        .get(
          `/api/v1/namespaces/${testNamespace.namespace.id}/metrics/findingsInRange?page=1&items=20&sortOrder=DESC&sortBy=count&startRange=${startDate}&endRange=${endDate}`
        )
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)

      expect(result.statusCode).toBe(HttpStatus.OK)
      expect(+result.body.pagination.totalCount).toBe(1)
      expect(+result.body.data[0].runId).toBe(runId)
      expect(+result.body.data[0].count).toBe(expectedCount)
      expect(+result.body.data[0].diff).toBe(expectedDiff)
    })
  })

  describe('GET latestRunFindings', () => {
    it('should be defined', async () => {
      const httpServer = await nestTestingApp.app.getHttpServer()

      const result = await supertest
        .agent(httpServer)
        .get(
          `/api/v1/namespaces/${testNamespace.namespace.id}/metrics/latestRunFindings?page=1&items=20&sortOrder=DESC&sortBy=count`
        )
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)

      expect(result.statusCode).toBe(HttpStatus.OK)
      expect(result.body.pagination).toBeDefined()
      expect(result.body.data).toBeDefined()
    })

    it('should return number of findings matching the criteria', async () => {
      const expectedEntries = 10
      const expectedCount = 4
      const expectedDiff = -6

      const httpServer = await nestTestingApp.app.getHttpServer()
      const configFile = path.join(
        __dirname,
        'mocks',
        'qg-config-10-findings-red-status.yaml'
      )
      let resultFile = path.join(
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

      await checkMetricsDatabaseEntries(0)
      const body = {
        configId: await createConfiguration(configFile),
      }

      // first run
      let runId = await postRun(body)
      await checkRunDatabaseEntry(runId)

      await completeRun(runId, RunResult.Red)
      await checkMetricsDatabaseEntries(runId * expectedEntries)

      // second run
      resultFile = path.join(
        __dirname,
        'mocks',
        'qg-result-4-findings-red-status.yaml'
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
      runId = await postRun(body)
      await checkRunDatabaseEntry(runId)

      await completeRun(runId, RunResult.Red)
      await checkMetricsDatabaseEntries(runId * expectedEntries)

      const result = await supertest
        .agent(httpServer)
        .get(
          `/api/v1/namespaces/${testNamespace.namespace.id}/metrics/latestRunFindings?page=1&items=20&sortOrder=DESC&sortBy=runId`
        )
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)

      expect(result.statusCode).toBe(HttpStatus.OK)
      expect(+result.body.pagination.totalCount).toBe(1)
      expect(+result.body.data[0].runId).toBe(runId)
      expect(+result.body.data[0].count).toBe(expectedCount)
      expect(+result.body.data[0].diff).toBe(expectedDiff)
    })
  })

  describe('GET LatestRunFindingsInRange', () => {
    it('should be defined', async () => {
      const httpServer = await nestTestingApp.app.getHttpServer()

      const result = await supertest
        .agent(httpServer)
        .get(
          `/api/v1/namespaces/${testNamespace.namespace.id}/metrics/latestRunFindingsInRange?page=1&items=20&sortOrder=DESC&sortBy=count&startRange=1970-01-01%2000%3A00%3A00&endRange=2038-01-19%2003%3A14%3A07`
        )
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)

      expect(result.statusCode).toBe(HttpStatus.OK)
      expect(result.body.pagination).toBeDefined()
      expect(result.body.data).toBeDefined()
    })

    it('should return number of findings matching the criteria', async () => {
      const expectedEntries = 10
      const expectedCount = 4
      const expectedDiff = -6

      const httpServer = await nestTestingApp.app.getHttpServer()
      const configFile = path.join(
        __dirname,
        'mocks',
        'qg-config-10-findings-red-status.yaml'
      )
      let resultFile = path.join(
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

      await checkMetricsDatabaseEntries(0)
      const body = {
        configId: await createConfiguration(configFile),
      }

      // first run
      let runId = await postRun(body)
      await checkRunDatabaseEntry(runId)

      await new Promise((resolve) => setTimeout(resolve, 150))
      await completeRun(runId, RunResult.Red)

      await new Promise((resolve) => setTimeout(resolve, 150))
      await checkMetricsDatabaseEntries(runId * expectedEntries)

      // second run
      const startDate = new Date().toISOString()

      resultFile = path.join(
        __dirname,
        'mocks',
        'qg-result-4-findings-red-status.yaml'
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
      runId = await postRun(body)
      await checkRunDatabaseEntry(runId)

      await new Promise((resolve) => setTimeout(resolve, 150))
      await completeRun(runId, RunResult.Red)

      await new Promise((resolve) => setTimeout(resolve, 150))
      await checkMetricsDatabaseEntries(runId * expectedEntries)

      // third run
      const endDate = new Date().toISOString()

      resultFile = path.join(
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
      runId = await postRun(body)
      await checkRunDatabaseEntry(runId)

      await completeRun(runId, RunResult.Red)
      await checkMetricsDatabaseEntries(runId * expectedEntries)

      const result = await supertest
        .agent(httpServer)
        .get(
          `/api/v1/namespaces/${testNamespace.namespace.id}/metrics/latestRunFindingsInRange?page=1&items=20&sortOrder=DESC&sortBy=count&startRange=${startDate}&endRange=${endDate}`
        )
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)

      expect(result.statusCode).toBe(HttpStatus.OK)
      expect(+result.body.pagination.totalCount).toBe(1)
      expect(+result.body.data[0].runId).toBe(2) // runId of second run
      expect(+result.body.data[0].count).toBe(expectedCount)
      expect(+result.body.data[0].diff).toBe(expectedDiff)
    })
  })

  async function createConfiguration(filepath: string): Promise<void> {
    const httpServer = await nestTestingApp.app.getHttpServer()

    const response = await supertest
      .agent(httpServer)
      .post(`/api/v1/namespaces/${testNamespace.namespace.id}/configs`)
      .send({ name: 'Metrics Controller (Integration Test)' })
      .set('Authorization', `Bearer ${apiToken}`)
      .set('Content-Type', 'application/json')
      .expect(HttpStatus.CREATED)
    const configId = response.body.id

    await supertest
      .agent(httpServer)
      .post(
        `/api/v1/namespaces/${testNamespace.namespace.id}/configs/${configId}/files`
      )
      .field('filename', 'qg-config.yaml')
      .attach('content', await readFile(filepath), {
        filename: 'qg-config.yaml',
        contentType: 'application/yaml',
      })
      .set('Authorization', `Bearer ${apiToken}`)
      .expect(HttpStatus.CREATED)
    return configId
  }

  async function checkRunDatabaseEntry(runId: number): Promise<void> {
    const runEntity: Run =
      await nestTestingApp.repositories.runRepository.findOneBy({
        id: runId,
      })
    expect(runEntity.id, `Run in database has not the right id`).toEqual(runId)
    expect(runEntity.status, `Run in database has not the right status`).oneOf([
      RunStatus.Running,
      RunStatus.Pending,
    ])
    expect(
      runEntity.storagePath.length,
      `Run in database does not have a storage path`
    ).toBeDefined()
  }

  async function checkMetricsDatabaseEntries(
    expectedNumber: number
  ): Promise<void> {
    expect(
      await nestTestingApp.repositories.metricRepository.count(),
      `Expected ${expectedNumber} elements in database`
    ).toBe(expectedNumber)
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

  async function awaitPending(runId: number): Promise<void> {
    let run = await getRun(runId)
    while (run.status === RunStatus.Pending) {
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
})
