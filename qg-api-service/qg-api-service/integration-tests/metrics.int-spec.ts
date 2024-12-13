// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { HttpStatus } from '@nestjs/common'
import { readFile } from 'fs/promises'
import { SetupServer, setupServer } from 'msw/node'
import * as path from 'path'
import { Readable } from 'stream'
import * as supertest from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RunResult } from '../src/namespace/run/run.entity'
import { SecretStorage } from '../src/namespace/secret/secret-storage.service'
import {
  BlobStore,
  MinIOStoreImpl,
} from '../src/namespace/workflow/minio.service'
import { handlers } from './mocks'
import {
  NamespaceTestEnvironment,
  NestTestingApp,
  NestUtil,
  checkRepositoryEntriesCount,
  checkRun,
  completeRun,
  createConfig,
  expectStatus,
  postRun,
} from './util'

describe('Metrics Controller', () => {
  let nestTestingApp: NestTestingApp
  let allRequests: Request[] = []
  let server: SetupServer

  let apiToken
  let testNamespace: NamespaceTestEnvironment
  const testName = 'Metrics (Integration Test)'
  const testFilename = 'qg-config.yaml'
  const testContentType = 'application/yaml'
  let testContext

  beforeEach(async () => {
    const nestUtil = new NestUtil()
    nestTestingApp = await nestUtil.startNestApplication()
    const databaseContent = await nestUtil.initDatabaseContent()
    testNamespace = databaseContent.testNamespace

    apiToken = await nestTestingApp.utils.getUserToken(testNamespace.users[0])

    server = setupServer(...handlers)
    server.listen()
    allRequests = []
    server.events.on('request:start', ({ request }) => {
      const url = new URL(request.url)
      if (!url.host.match(/localhost|127\.0\.0\.1/)) {
        allRequests.push(request)
      }
    })

    vi.spyOn(
      nestTestingApp.testingModule.get<SecretStorage>(SecretStorage),
      'getSecrets',
    ).mockImplementation(() => Promise.resolve({}))
    vi.spyOn(
      nestTestingApp.testingModule.get<MinIOStoreImpl>(BlobStore),
      'uploadPayload',
    ).mockImplementation(() => {
      return Promise.resolve()
    })
    vi.spyOn(
      nestTestingApp.testingModule.get<MinIOStoreImpl>(BlobStore),
      'fileExists',
    ).mockImplementation(() => Promise.resolve(true))
    vi.spyOn(
      nestTestingApp.testingModule.get<MinIOStoreImpl>(BlobStore),
      'downloadLogs',
    ).mockImplementation(() =>
      Promise.resolve('Cool logs\nOverall result: GREEN'),
    )

    testContext = {
      nestTestingApp: nestTestingApp,
      testNamespace: testNamespace,
      apiToken: apiToken,
    }
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
          `/api/v1/namespaces/${testNamespace.namespace.id}/metrics/findings?page=1&items=20&sortOrder=DESC&sortBy=count`,
        )
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)

      expectStatus(result, HttpStatus.OK)
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
        'qg-config-10-findings-red-status.yaml',
      )
      const resultFile = path.join(
        __dirname,
        'mocks',
        'qg-result-10-findings-red-status.yaml',
      )
      vi.spyOn(
        nestTestingApp.testingModule.get<MinIOStoreImpl>(BlobStore),
        'downloadResult',
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

      await checkRepositoryEntriesCount(
        nestTestingApp.repositories.metricRepository,
        0,
      )
      const body = {
        configId: await createConfig(testContext, testName, [
          {
            filepath: configFile,
            filename: testFilename,
            contentType: testContentType,
          },
        ]),
      }

      const runId = await postRun(testContext, body)
      await checkRun(nestTestingApp, runId)

      await completeRun(testContext, runId, RunResult.Red)
      await checkRepositoryEntriesCount(
        nestTestingApp.repositories.metricRepository,
        runId * expectedMetricsEntries,
      )

      const result = await supertest
        .agent(httpServer)
        .get(
          `/api/v1/namespaces/${testNamespace.namespace.id}/metrics/findings?page=1&items=20&sortOrder=ASC&sortBy=runId`,
        )
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)

      expectStatus(result, HttpStatus.OK)
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
        'qg-config-10-findings-red-status.yaml',
      )
      let resultFile = path.join(
        __dirname,
        'mocks',
        'qg-result-10-findings-red-status.yaml',
      )
      vi.spyOn(
        nestTestingApp.testingModule.get<MinIOStoreImpl>(BlobStore),
        'downloadResult',
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

      await checkRepositoryEntriesCount(
        nestTestingApp.repositories.metricRepository,
        0,
      )
      const body = {
        configId: await createConfig(testContext, testName, [
          {
            filepath: configFile,
            filename: testFilename,
            contentType: testContentType,
          },
        ]),
      }

      // first run
      let runId = await postRun(testContext, body)
      await checkRun(nestTestingApp, runId)

      await completeRun(testContext, runId, RunResult.Red)
      await checkRepositoryEntriesCount(
        nestTestingApp.repositories.metricRepository,
        runId * expectedEntries,
      )

      // second run
      resultFile = path.join(
        __dirname,
        'mocks',
        'qg-result-4-findings-red-status.yaml',
      )
      vi.spyOn(
        nestTestingApp.testingModule.get<MinIOStoreImpl>(BlobStore),
        'downloadResult',
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
      runId = await postRun(testContext, body)
      await checkRun(nestTestingApp, runId)

      await completeRun(testContext, runId, RunResult.Red)
      await checkRepositoryEntriesCount(
        nestTestingApp.repositories.metricRepository,
        runId * expectedEntries,
      )

      const result = await supertest
        .agent(httpServer)
        .get(
          `/api/v1/namespaces/${testNamespace.namespace.id}/metrics/findings?page=1&items=20&sortOrder=DESC&sortBy=runId`,
        )
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)

      expectStatus(result, HttpStatus.OK)
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
        'qg-config-4-findings-red-status.yaml',
      )
      let resultFile = path.join(
        __dirname,
        'mocks',
        'qg-result-4-findings-red-status.yaml',
      )
      vi.spyOn(
        nestTestingApp.testingModule.get<MinIOStoreImpl>(BlobStore),
        'downloadResult',
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

      await checkRepositoryEntriesCount(
        nestTestingApp.repositories.metricRepository,
        0,
      )
      const body = {
        configId: await createConfig(testContext, testName, [
          {
            filepath: configFile,
            filename: testFilename,
            contentType: testContentType,
          },
        ]),
      }

      // first run
      let runId = await postRun(testContext, body)
      await checkRun(nestTestingApp, runId)

      await completeRun(testContext, runId, RunResult.Red)
      await checkRepositoryEntriesCount(
        nestTestingApp.repositories.metricRepository,
        runId * expectedEntries - expectedDiff,
      )

      // second run
      resultFile = path.join(
        __dirname,
        'mocks',
        'qg-result-10-findings-red-status.yaml',
      )
      vi.spyOn(
        nestTestingApp.testingModule.get<MinIOStoreImpl>(BlobStore),
        'downloadResult',
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
      runId = await postRun(testContext, body)
      await checkRun(nestTestingApp, runId)

      await completeRun(testContext, runId, RunResult.Red)
      await checkRepositoryEntriesCount(
        nestTestingApp.repositories.metricRepository,
        runId * expectedEntries - expectedDiff,
      )

      const result = await supertest
        .agent(httpServer)
        .get(
          `/api/v1/namespaces/${testNamespace.namespace.id}/metrics/findings?page=1&items=20&sortOrder=DESC&sortBy=runId`,
        )
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)

      expectStatus(result, HttpStatus.OK)
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
        'qg-config-10-findings-red-status.yaml',
      )
      let resultFile = path.join(
        __dirname,
        'mocks',
        'qg-result-10-findings-red-status.yaml',
      )
      vi.spyOn(
        nestTestingApp.testingModule.get<MinIOStoreImpl>(BlobStore),
        'downloadResult',
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

      await checkRepositoryEntriesCount(
        nestTestingApp.repositories.metricRepository,
        0,
      )
      const body = {
        configId: await createConfig(testContext, testName, [
          {
            filepath: configFile,
            filename: testFilename,
            contentType: testContentType,
          },
        ]),
      }

      // first run
      let runId = await postRun(testContext, body)
      await checkRun(nestTestingApp, runId)

      await completeRun(testContext, runId, RunResult.Red)
      await checkRepositoryEntriesCount(
        nestTestingApp.repositories.metricRepository,
        runId * expectedEntries,
      )

      // manually resolve 2 findings
      const manuallyResolvedRunId = runId
      const response = await supertest
        .agent(httpServer)
        .get(
          `/api/v1/namespaces/${testNamespace.namespace.id}/findings?page=1&items=20&sortOrder=DESC&sortBy=id`,
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
                item.justification === 'I am the reason 1',
            )[0].id
          }`,
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
                item.justification === 'I am the reason 2',
            )[0].id
          }`,
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
          `/api/v1/namespaces/${testNamespace.namespace.id}/metrics/findings?page=1&items=20&sortOrder=DESC&sortBy=runId`,
        )
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)

      // second run
      resultFile = path.join(
        __dirname,
        'mocks',
        'qg-result-4-findings-red-status.yaml',
      )
      vi.spyOn(
        nestTestingApp.testingModule.get<MinIOStoreImpl>(BlobStore),
        'downloadResult',
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
      runId = await postRun(testContext, body)
      await checkRun(nestTestingApp, runId)

      await completeRun(testContext, runId, RunResult.Red)
      await checkRepositoryEntriesCount(
        nestTestingApp.repositories.metricRepository,
        runId * expectedEntries,
      )

      const result = await supertest
        .agent(httpServer)
        .get(
          `/api/v1/namespaces/${testNamespace.namespace.id}/metrics/findings?page=1&items=20&sortOrder=DESC&sortBy=runId`,
        )
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)

      expectStatus(manuallyResolvedResult, HttpStatus.OK)
      expect(+manuallyResolvedResult.body.pagination.totalCount).toBe(
        manuallyResolvedRunId,
      )
      expect(+manuallyResolvedResult.body.data[0].runId).toBe(
        manuallyResolvedRunId,
      )
      expect(+manuallyResolvedResult.body.data[0].count).toBe(
        expectedManuallyResolvedCount,
      )
      expect(+manuallyResolvedResult.body.data[0].diff).toBe(
        expectedManuallyResolvedDiff,
      )

      expectStatus(result, HttpStatus.OK)
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
        'qg-config-10-findings-red-status.yaml',
      )
      const resultFile = path.join(
        __dirname,
        'mocks',
        'qg-result-10-findings-red-status.yaml',
      )
      vi.spyOn(
        nestTestingApp.testingModule.get<MinIOStoreImpl>(BlobStore),
        'downloadResult',
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

      await checkRepositoryEntriesCount(
        nestTestingApp.repositories.metricRepository,
        0,
      )
      const body = {
        configId: await createConfig(testContext, testName, [
          {
            filepath: configFile,
            filename: testFilename,
            contentType: testContentType,
          },
        ]),
      }

      // first run
      let runId = await postRun(testContext, body)
      await checkRun(nestTestingApp, runId)

      await completeRun(testContext, runId, RunResult.Red)
      await checkRepositoryEntriesCount(
        nestTestingApp.repositories.metricRepository,
        runId * expectedEntries,
      )

      // second run
      runId = await postRun(testContext, body)
      await checkRun(nestTestingApp, runId)

      await completeRun(testContext, runId, RunResult.Red)
      await checkRepositoryEntriesCount(
        nestTestingApp.repositories.metricRepository,
        2 * expectedEntries,
      )

      const result = await supertest
        .agent(httpServer)
        .get(
          `/api/v1/namespaces/${testNamespace.namespace.id}/metrics/findings?page=1&items=20&sortOrder=DESC&sortBy=runId`,
        )
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)

      expectStatus(result, HttpStatus.OK)
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
        'qg-config-10-findings-red-status.yaml',
      )
      let resultFile = path.join(
        __dirname,
        'mocks',
        'qg-result-10-findings-red-status.yaml',
      )
      vi.spyOn(
        nestTestingApp.testingModule.get<MinIOStoreImpl>(BlobStore),
        'downloadResult',
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

      await checkRepositoryEntriesCount(
        nestTestingApp.repositories.metricRepository,
        0,
      )
      const body = {
        configId: await createConfig(testContext, testName, [
          {
            filepath: configFile,
            filename: testFilename,
            contentType: testContentType,
          },
        ]),
      }

      // first run - register new findings
      let runId = await postRun(testContext, body)
      await checkRun(nestTestingApp, runId)

      await completeRun(testContext, runId, RunResult.Red)
      await checkRepositoryEntriesCount(
        nestTestingApp.repositories.metricRepository,
        runId * expectedEntries,
      )

      // second run - first GREEN scenario
      resultFile = path.join(
        __dirname,
        'mocks',
        'qg-result-0-findings-green-status.yaml',
      )
      vi.spyOn(
        nestTestingApp.testingModule.get<MinIOStoreImpl>(BlobStore),
        'downloadResult',
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
      runId = await postRun(testContext, body)
      await checkRun(nestTestingApp, runId)

      await completeRun(testContext, runId, RunResult.Green)
      await checkRepositoryEntriesCount(
        nestTestingApp.repositories.metricRepository,
        runId * expectedEntries,
      )

      // third run - second GREEN scenario
      resultFile = path.join(
        __dirname,
        'mocks',
        'qg-result-0-findings-green-status.yaml',
      )
      vi.spyOn(
        nestTestingApp.testingModule.get<MinIOStoreImpl>(BlobStore),
        'downloadResult',
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
      runId = await postRun(testContext, body)
      await checkRun(nestTestingApp, runId)

      await completeRun(testContext, runId, RunResult.Green)
      await checkRepositoryEntriesCount(
        nestTestingApp.repositories.metricRepository,
        runId * expectedEntries,
      )

      const result = await supertest
        .agent(httpServer)
        .get(
          `/api/v1/namespaces/${testNamespace.namespace.id}/metrics/findings?page=1&items=20&sortOrder=DESC&sortBy=runId`,
        )
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)

      expectStatus(result, HttpStatus.OK)
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
        'qg-config-0-findings-green-status.yaml',
      )
      const resultFile = path.join(
        __dirname,
        'mocks',
        'qg-result-0-findings-green-status.yaml',
      )
      vi.spyOn(
        nestTestingApp.testingModule.get<MinIOStoreImpl>(BlobStore),
        'downloadResult',
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

      await checkRepositoryEntriesCount(
        nestTestingApp.repositories.metricRepository,
        0,
      )
      const body = {
        configId: await createConfig(testContext, testName, [
          {
            filepath: configFile,
            filename: testFilename,
            contentType: testContentType,
          },
        ]),
      }

      // first run - no Findings
      let runId = await postRun(testContext, body)
      runId = await postRun(testContext, body)
      await checkRun(nestTestingApp, runId)

      await completeRun(testContext, runId, RunResult.Green)
      await checkRepositoryEntriesCount(
        nestTestingApp.repositories.metricRepository,
        runId * expectedEntries,
      )

      // second run - no Findings
      runId = await postRun(testContext, body)
      await checkRun(nestTestingApp, runId)

      await completeRun(testContext, runId, RunResult.Green)
      await checkRepositoryEntriesCount(
        nestTestingApp.repositories.metricRepository,
        runId * expectedEntries,
      )

      const result = await supertest
        .agent(httpServer)
        .get(
          `/api/v1/namespaces/${testNamespace.namespace.id}/metrics/findings?page=1&items=20&sortOrder=DESC&sortBy=runId`,
        )
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)

      expectStatus(result, HttpStatus.OK)
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
          `/api/v1/namespaces/${testNamespace.namespace.id}/metrics/findingsInRange?page=1&items=20&sortOrder=ASC&sortBy=runId&startRange=1970-01-01%2000%3A00%3A00&endRange=2038-01-19%2003%3A14%3A07`,
        )
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)

      expectStatus(result, HttpStatus.OK)
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
        'qg-config-10-findings-red-status.yaml',
      )
      const resultFile = path.join(
        __dirname,
        'mocks',
        'qg-result-10-findings-red-status.yaml',
      )
      vi.spyOn(
        nestTestingApp.testingModule.get<MinIOStoreImpl>(BlobStore),
        'downloadResult',
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

      await checkRepositoryEntriesCount(
        nestTestingApp.repositories.metricRepository,
        0,
      )
      const body = {
        configId: await createConfig(testContext, testName, [
          {
            filepath: configFile,
            filename: testFilename,
            contentType: testContentType,
          },
        ]),
      }

      // first run
      let runId = await postRun(testContext, body)
      await checkRun(nestTestingApp, runId)

      await completeRun(testContext, runId, RunResult.Red)
      await checkRepositoryEntriesCount(
        nestTestingApp.repositories.metricRepository,
        runId * expectedEntries,
      )

      // second run
      const startDate = new Date().toISOString()
      const endDate = new Date('2038-01-19 03:14:07').toISOString()

      runId = await postRun(testContext, body)
      await checkRun(nestTestingApp, runId)

      await completeRun(testContext, runId, RunResult.Red)
      await checkRepositoryEntriesCount(
        nestTestingApp.repositories.metricRepository,
        runId * expectedEntries,
      )

      const result = await supertest
        .agent(httpServer)
        .get(
          `/api/v1/namespaces/${testNamespace.namespace.id}/metrics/findingsInRange?page=1&items=20&sortOrder=DESC&sortBy=count&startRange=${startDate}&endRange=${endDate}`,
        )
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)

      expectStatus(result, HttpStatus.OK)
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
          `/api/v1/namespaces/${testNamespace.namespace.id}/metrics/latestRunFindings?page=1&items=20&sortOrder=DESC&sortBy=count`,
        )
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)

      expectStatus(result, HttpStatus.OK)
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
        'qg-config-10-findings-red-status.yaml',
      )
      let resultFile = path.join(
        __dirname,
        'mocks',
        'qg-result-10-findings-red-status.yaml',
      )
      vi.spyOn(
        nestTestingApp.testingModule.get<MinIOStoreImpl>(BlobStore),
        'downloadResult',
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

      await checkRepositoryEntriesCount(
        nestTestingApp.repositories.metricRepository,
        0,
      )
      const body = {
        configId: await createConfig(testContext, testName, [
          {
            filepath: configFile,
            filename: testFilename,
            contentType: testContentType,
          },
        ]),
      }

      // first run
      let runId = await postRun(testContext, body)
      await checkRun(nestTestingApp, runId)

      await completeRun(testContext, runId, RunResult.Red)
      await checkRepositoryEntriesCount(
        nestTestingApp.repositories.metricRepository,
        runId * expectedEntries,
      )

      // second run
      resultFile = path.join(
        __dirname,
        'mocks',
        'qg-result-4-findings-red-status.yaml',
      )
      vi.spyOn(
        nestTestingApp.testingModule.get<MinIOStoreImpl>(BlobStore),
        'downloadResult',
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
      runId = await postRun(testContext, body)
      await checkRun(nestTestingApp, runId)

      await completeRun(testContext, runId, RunResult.Red)
      await checkRepositoryEntriesCount(
        nestTestingApp.repositories.metricRepository,
        runId * expectedEntries,
      )

      const result = await supertest
        .agent(httpServer)
        .get(
          `/api/v1/namespaces/${testNamespace.namespace.id}/metrics/latestRunFindings?page=1&items=20&sortOrder=DESC&sortBy=runId`,
        )
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)

      expectStatus(result, HttpStatus.OK)
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
          `/api/v1/namespaces/${testNamespace.namespace.id}/metrics/latestRunFindingsInRange?page=1&items=20&sortOrder=DESC&sortBy=count&startRange=1970-01-01%2000%3A00%3A00&endRange=2038-01-19%2003%3A14%3A07`,
        )
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)

      expectStatus(result, HttpStatus.OK)
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
        'qg-config-10-findings-red-status.yaml',
      )
      let resultFile = path.join(
        __dirname,
        'mocks',
        'qg-result-10-findings-red-status.yaml',
      )
      vi.spyOn(
        nestTestingApp.testingModule.get<MinIOStoreImpl>(BlobStore),
        'downloadResult',
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

      await checkRepositoryEntriesCount(
        nestTestingApp.repositories.metricRepository,
        0,
      )
      const body = {
        configId: await createConfig(testContext, testName, [
          {
            filepath: configFile,
            filename: testFilename,
            contentType: testContentType,
          },
        ]),
      }

      // first run
      let runId = await postRun(testContext, body)
      await checkRun(nestTestingApp, runId)

      await new Promise((resolve) => setTimeout(resolve, 150))
      await completeRun(testContext, runId, RunResult.Red)

      await new Promise((resolve) => setTimeout(resolve, 150))
      await checkRepositoryEntriesCount(
        nestTestingApp.repositories.metricRepository,
        runId * expectedEntries,
      )

      // second run
      const startDate = new Date().toISOString()

      resultFile = path.join(
        __dirname,
        'mocks',
        'qg-result-4-findings-red-status.yaml',
      )
      vi.spyOn(
        nestTestingApp.testingModule.get<MinIOStoreImpl>(BlobStore),
        'downloadResult',
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
      runId = await postRun(testContext, body)
      await checkRun(nestTestingApp, runId)

      await new Promise((resolve) => setTimeout(resolve, 150))
      await completeRun(testContext, runId, RunResult.Red)

      await new Promise((resolve) => setTimeout(resolve, 150))
      await checkRepositoryEntriesCount(
        nestTestingApp.repositories.metricRepository,
        runId * expectedEntries,
      )

      // third run
      const endDate = new Date().toISOString()

      resultFile = path.join(
        __dirname,
        'mocks',
        'qg-result-10-findings-red-status.yaml',
      )
      vi.spyOn(
        nestTestingApp.testingModule.get<MinIOStoreImpl>(BlobStore),
        'downloadResult',
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
      runId = await postRun(testContext, body)
      await checkRun(nestTestingApp, runId)

      await completeRun(testContext, runId, RunResult.Red)
      await checkRepositoryEntriesCount(
        nestTestingApp.repositories.metricRepository,
        runId * expectedEntries,
      )

      const result = await supertest
        .agent(httpServer)
        .get(
          `/api/v1/namespaces/${testNamespace.namespace.id}/metrics/latestRunFindingsInRange?page=1&items=20&sortOrder=DESC&sortBy=count&startRange=${startDate}&endRange=${endDate}`,
        )
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)

      expectStatus(result, HttpStatus.OK)
      expect(+result.body.pagination.totalCount).toBe(1)
      expect(+result.body.data[0].runId).toBe(2) // runId of second run
      expect(+result.body.data[0].count).toBe(expectedCount)
      expect(+result.body.data[0].diff).toBe(expectedDiff)
    })
  })
})
