// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { HttpStatus } from '@nestjs/common'
import { readFile } from 'fs/promises'
import { SetupServer, setupServer } from 'msw/node'
import * as path from 'path'
import { GetFindingDTO } from '../src/namespace/findings/dto/get-finding.dto'
import { Readable } from 'stream'
import * as supertest from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Finding } from '../src/namespace/findings/entity/finding.entity'
import { StatusType } from '../src/namespace/findings/utils/enums/statusType.enum'
import { RunResult } from '../src/namespace/run/run.entity'
import { SecretStorage } from '../src/namespace/secret/secret-storage.service'
import {
  BlobStore,
  MinIOStoreImpl,
} from '../src/namespace/workflow/minio.service'
import { handlers } from './mocks'
import { NamespaceTestEnvironment, NestTestingApp, NestUtil } from './util'
import { checkRepositoryEntriesCount, checkRun, completeRun, createConfigWithFiles, postRun } from './util/commons'

describe('Findings Controller', () => {
  let nestTestingApp: NestTestingApp
  let allRequests: Request[] = []
  let server: SetupServer

  let apiToken
  let testNamespace: NamespaceTestEnvironment
  const testName = 'Findings (Integration Test)'
  const testFilename = 'qg-config.yaml'
  const testContentType = 'application/yaml'

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
      console.log('MSW attached:')
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
          `/api/v1/namespaces/${testNamespace.namespace.id}/findings?page=1&items=20&sortOrder=DESC&sortBy=id`,
        )
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)

      expect(result.statusCode).toBe(HttpStatus.OK)
      expect(result.body.pagination).toBeDefined()
      expect(result.body.data).toBeDefined()
    })

    it('should return the number of findings matching the criteria', async () => {
      const expectedEntries = 10
      const expectedResolved = 0
      const expectedUnresolved = 10
      const expectedOccurrenceCount = 1

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

      await checkRepositoryEntriesCount(nestTestingApp.repositories.findingRepository, 0)
      const body = {
        configId: await createConfigWithFiles(nestTestingApp, testNamespace, testName, apiToken, [{
          filepath: configFile,
          filename: testFilename,
          contentType: testContentType,
        }]),
      }

      const runId = await postRun(nestTestingApp, testNamespace, body, apiToken)
      await checkRun(nestTestingApp, runId)

      await completeRun(nestTestingApp, testNamespace, runId, apiToken, RunResult.Red)
      await checkRepositoryEntriesCount(nestTestingApp.repositories.findingRepository, runId * expectedEntries)

      const result = await supertest
        .agent(httpServer)
        .get(
          `/api/v1/namespaces/${testNamespace.namespace.id}/findings?page=1&items=20&sortOrder=DESC&sortBy=id`,
        )
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)

      expect(result.statusCode).toBe(HttpStatus.OK)
      expect(result.body.pagination.totalCount).toBe(expectedEntries)
      expect(
        countFindingsWithStatus(result.body.data, StatusType.UNRESOLVED),
      ).toBe(expectedUnresolved)
      expect(
        countFindingsWithStatus(result.body.data, StatusType.RESOLVED),
      ).toBe(expectedResolved)

      result.body.data.forEach((finding: GetFindingDTO) =>
        expect(finding).toHaveProperty(
          'occurrenceCount',
          expectedOccurrenceCount,
        ),
      )
    })

    it('should autoresolve the findings when previously associated results are missing in the second run', async () => {
      const expectedEntries = 10
      const expectedResolved = 6
      const expectedUnresolved = 4

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

      await checkRepositoryEntriesCount(nestTestingApp.repositories.findingRepository, 0)
      const body = {
        configId: await createConfigWithFiles(nestTestingApp, testNamespace, testName, apiToken, [{
          filepath: configFile,
          filename: testFilename,
          contentType: testContentType,
        }]),
      }

      // first run
      let runId = await postRun(nestTestingApp, testNamespace, body, apiToken)
      await checkRun(nestTestingApp, runId)

      await completeRun(nestTestingApp, testNamespace, runId, apiToken, RunResult.Red)
      await checkRepositoryEntriesCount(nestTestingApp.repositories.findingRepository, expectedEntries)
      await checkFindingsRunId(runId)

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
      runId = await postRun(nestTestingApp, testNamespace, body, apiToken)
      await checkRun(nestTestingApp, runId)

      await completeRun(nestTestingApp, testNamespace, runId, apiToken, RunResult.Red)
      await checkRepositoryEntriesCount(nestTestingApp.repositories.findingRepository, expectedEntries)
      await checkFindingsRunId(runId)

      const result = await supertest
        .agent(httpServer)
        .get(
          `/api/v1/namespaces/${testNamespace.namespace.id}/findings?page=1&items=20&sortOrder=DESC&sortBy=id`,
        )
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)

      expect(result.statusCode).toBe(HttpStatus.OK)
      expect(result.body.pagination.totalCount).toBe(expectedEntries)
      expect(
        countFindingsWithStatus(result.body.data, StatusType.UNRESOLVED),
      ).toBe(expectedUnresolved)
      expect(
        countFindingsWithStatus(result.body.data, StatusType.RESOLVED),
      ).toBe(expectedResolved)
    })

    it('should NOT update metadata when it autoresolves missing finding associated with previous run', async () => {
      const expectedEntries = 10
      const expectedResolved = 6
      const expectedUnresolved = 4
      const expectedMetadata: Map<string, string> = new Map()
      expectedMetadata.set('{}', '{}')
      expectedMetadata.set(
        '{"key1":"value1","key2":"value2"}',
        '{"key1":"value1","key2":"value2"}',
      )

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

      await checkRepositoryEntriesCount(nestTestingApp.repositories.findingRepository, 0)
      const body = {
        configId: await createConfigWithFiles(nestTestingApp, testNamespace, testName, apiToken, [{
          filepath: configFile,
          filename: testFilename,
          contentType: testContentType,
        }]),
      }

      // first run
      let runId = await postRun(nestTestingApp, testNamespace, body, apiToken)
      await checkRun(nestTestingApp, runId)

      await completeRun(nestTestingApp, testNamespace, runId, apiToken, RunResult.Red)
      await checkRepositoryEntriesCount(nestTestingApp.repositories.findingRepository, expectedEntries)
      await checkFindingsRunId(runId)

      let result = await supertest
        .agent(httpServer)
        .get(
          `/api/v1/namespaces/${testNamespace.namespace.id}/findings?page=1&items=20&sortOrder=DESC&sortBy=id`,
        )
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)
      const originalMetadata = saveFindingsMetadata(result.body.data)

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
      runId = await postRun(nestTestingApp, testNamespace, body, apiToken)
      await checkRun(nestTestingApp, runId)

      await completeRun(nestTestingApp, testNamespace, runId, apiToken, RunResult.Red)
      await checkRepositoryEntriesCount(nestTestingApp.repositories.findingRepository, expectedEntries)
      await checkFindingsRunId(runId)

      result = await supertest
        .agent(httpServer)
        .get(
          `/api/v1/namespaces/${testNamespace.namespace.id}/findings?page=1&items=20&sortOrder=DESC&sortBy=id`,
        )
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)

      expect(result.statusCode).toBe(HttpStatus.OK)
      expect(result.body.pagination.totalCount).toBe(expectedEntries)
      expect(
        countFindingsWithStatus(result.body.data, StatusType.UNRESOLVED),
      ).toBe(expectedUnresolved)
      expect(
        countFindingsWithStatus(result.body.data, StatusType.RESOLVED),
      ).toBe(expectedResolved)
      expect(countFindingsWithManualResolveFlag(result.body.data, false)).toBe(
        expectedResolved,
      )
      // we're interested in resolved findings only
      const resolvedFindings: GetFindingDTO[] = result.body.data.filter(
        (finding: GetFindingDTO) => finding.status == 'resolved',
      )
      checkFindingsMetadata(
        resolvedFindings,
        originalMetadata,
        expectedMetadata,
      )
    })

    it('should increase the findings occurences count in two equal consecutive RED runs', async () => {
      const expectedEntries = 10
      const expectedResolved = 0
      const expectedUnresolved = 10
      const expectedOccurrenceCount = 2

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

      await checkRepositoryEntriesCount(nestTestingApp.repositories.findingRepository, 0)
      const body = {
        configId: await createConfigWithFiles(nestTestingApp, testNamespace, testName, apiToken, [{
          filepath: configFile,
          filename: testFilename,
          contentType: testContentType,
        }]),
      }

      // first run
      let runId = await postRun(nestTestingApp, testNamespace, body, apiToken)
      await checkRun(nestTestingApp, runId)

      await completeRun(nestTestingApp, testNamespace, runId, apiToken, RunResult.Red)
      await checkRepositoryEntriesCount(nestTestingApp.repositories.findingRepository, expectedEntries)
      await checkFindingsRunId(runId)

      // second run
      runId = await postRun(nestTestingApp, testNamespace, body, apiToken)
      await checkRun(nestTestingApp, runId)

      await completeRun(nestTestingApp, testNamespace, runId, apiToken, RunResult.Red)
      await checkRepositoryEntriesCount(nestTestingApp.repositories.findingRepository, expectedEntries)
      await checkFindingsRunId(runId)

      const result = await supertest
        .agent(httpServer)
        .get(
          `/api/v1/namespaces/${testNamespace.namespace.id}/findings?page=1&items=20&sortOrder=DESC&sortBy=id`,
        )
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)

      expect(result.statusCode).toBe(HttpStatus.OK)
      expect(result.body.pagination.totalCount).toBe(expectedEntries)
      expect(
        countFindingsWithStatus(result.body.data, StatusType.UNRESOLVED),
      ).toBe(expectedUnresolved)
      expect(
        countFindingsWithStatus(result.body.data, StatusType.RESOLVED),
      ).toBe(expectedResolved)
      checkFindingsOccurrenceCount(result.body.data, expectedOccurrenceCount)
    })

    it('should update metadata when occurence count is increased for existing unresolved findings', async () => {
      const expectedEntries = 10
      const expectedResolved = 6
      const expectedUnresolved = 4
      const expectedMetadata: Map<string, string> = new Map()
      expectedMetadata.set('{}', '{}')
      expectedMetadata.set(
        '{"key1":"value1","key2":"value2"}',
        '{"keyA":"newValueA","keyB":"newValueB","keyC":"newValueC"}',
      )

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

      await checkRepositoryEntriesCount(nestTestingApp.repositories.findingRepository, 0)
      const body = {
        configId: await createConfigWithFiles(nestTestingApp, testNamespace, testName, apiToken, [{
          filepath: configFile,
          filename: testFilename,
          contentType: testContentType,
        }]),
      }

      // first run
      let runId = await postRun(nestTestingApp, testNamespace, body, apiToken)
      await checkRun(nestTestingApp, runId)

      await completeRun(nestTestingApp, testNamespace, runId, apiToken, RunResult.Red)
      await checkRepositoryEntriesCount(nestTestingApp.repositories.findingRepository, expectedEntries)
      await checkFindingsRunId(runId)

      let result = await supertest
        .agent(httpServer)
        .get(
          `/api/v1/namespaces/${testNamespace.namespace.id}/findings?page=1&items=20&sortOrder=DESC&sortBy=id`,
        )
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)
      const originalMetadata = saveFindingsMetadata(result.body.data)

      // second run
      resultFile = path.join(
        __dirname,
        'mocks',
        'qg-result-4-new-metadata-findings-red-status.yaml',
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
      runId = await postRun(nestTestingApp, testNamespace, body, apiToken)
      await checkRun(nestTestingApp, runId)

      await completeRun(nestTestingApp, testNamespace, runId, apiToken, RunResult.Red)
      await checkRepositoryEntriesCount(nestTestingApp.repositories.findingRepository, expectedEntries)
      await checkFindingsRunId(runId)

      result = await supertest
        .agent(httpServer)
        .get(
          `/api/v1/namespaces/${testNamespace.namespace.id}/findings?page=1&items=20&sortOrder=DESC&sortBy=id`,
        )
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)

      expect(result.statusCode).toBe(HttpStatus.OK)
      expect(result.body.pagination.totalCount).toBe(expectedEntries)
      expect(
        countFindingsWithStatus(result.body.data, StatusType.UNRESOLVED),
      ).toBe(expectedUnresolved)
      expect(
        countFindingsWithStatus(result.body.data, StatusType.RESOLVED),
      ).toBe(expectedResolved)
      // we're interested in unresolved findings only
      const unresolvedFindings: GetFindingDTO[] = result.body.data.filter(
        (finding: GetFindingDTO) => finding.status == 'unresolved',
      )
      checkFindingsMetadata(
        unresolvedFindings,
        originalMetadata,
        expectedMetadata,
      )
    })

    it('should return the number of findings from RED checks even when run finished with ERROR overallStatus', async () => {
      const expectedEntries = 5
      const expectedResolved = 0
      const expectedUnresolved = 5
      const expectedOccurrenceCount = 1

      const httpServer = await nestTestingApp.app.getHttpServer()
      const configFile = path.join(
        __dirname,
        'mocks',
        'qg-config-5-findings-error-status.yaml',
      )
      const resultFile = path.join(
        __dirname,
        'mocks',
        'qg-result-5-findings-error-status.yaml',
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

      await checkRepositoryEntriesCount(nestTestingApp.repositories.findingRepository, 0)
      const body = {
        configId: await createConfigWithFiles(nestTestingApp, testNamespace, testName, apiToken, [{
          filepath: configFile,
          filename: testFilename,
          contentType: testContentType,
        }]),
      }

      const runId = await postRun(nestTestingApp, testNamespace, body, apiToken)
      await checkRun(nestTestingApp, runId)

      await completeRun(nestTestingApp, testNamespace, runId, apiToken, 'ERROR' as any)
      await checkRepositoryEntriesCount(nestTestingApp.repositories.findingRepository, expectedEntries)
      await checkFindingsRunId(runId)

      const result = await supertest
        .agent(httpServer)
        .get(
          `/api/v1/namespaces/${testNamespace.namespace.id}/findings?page=1&items=20&sortOrder=DESC&sortBy=id`,
        )
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)

      expect(result.statusCode).toBe(HttpStatus.OK)
      expect(result.body.pagination.totalCount).toBe(expectedEntries)
      expect(
        countFindingsWithStatus(result.body.data, StatusType.UNRESOLVED),
      ).toBe(expectedUnresolved)
      expect(
        countFindingsWithStatus(result.body.data, StatusType.RESOLVED),
      ).toBe(expectedResolved)
      checkFindingsOccurrenceCount(result.body.data, expectedOccurrenceCount)
    })

    it('should return no findings in consecutive GREEN runs', async () => {
      const expectedEntries = 0
      const expectedResolved = 0
      const expectedUnresolved = 0
      const expectedOccurrenceCount = 0

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

      await checkRepositoryEntriesCount(nestTestingApp.repositories.findingRepository, 0)
      const body = {
        configId: await createConfigWithFiles(nestTestingApp, testNamespace, testName, apiToken, [{
          filepath: configFile,
          filename: testFilename,
          contentType: testContentType,
        }]),
      }

      // first run
      let runId = await postRun(nestTestingApp, testNamespace, body, apiToken)
      await checkRun(nestTestingApp, runId)

      await completeRun(nestTestingApp, testNamespace, runId, apiToken, RunResult.Green)
      await checkRepositoryEntriesCount(nestTestingApp.repositories.findingRepository, expectedEntries)
      await checkFindingsRunId(runId)

      // second run
      runId = await postRun(nestTestingApp, testNamespace, body, apiToken)
      await checkRun(nestTestingApp, runId)

      await completeRun(nestTestingApp, testNamespace, runId, apiToken, RunResult.Green)
      await checkRepositoryEntriesCount(nestTestingApp.repositories.findingRepository, expectedEntries)
      await checkFindingsRunId(runId)

      const result = await supertest
        .agent(httpServer)
        .get(
          `/api/v1/namespaces/${testNamespace.namespace.id}/findings?page=1&items=20&sortOrder=DESC&sortBy=id`,
        )
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)

      expect(result.statusCode).toBe(HttpStatus.OK)
      expect(result.body.pagination.totalCount).toBe(expectedEntries)
      expect(
        countFindingsWithStatus(result.body.data, StatusType.UNRESOLVED),
      ).toBe(expectedUnresolved)
      expect(
        countFindingsWithStatus(result.body.data, StatusType.RESOLVED),
      ).toBe(expectedResolved)
      checkFindingsOccurrenceCount(result.body.data, expectedOccurrenceCount)
    })
  })

  describe('GET finding', () => {
    it('should be defined', async () => {
      const expectedEntries = 10

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

      await checkRepositoryEntriesCount(nestTestingApp.repositories.findingRepository, 0)
      const body = {
        configId: await createConfigWithFiles(nestTestingApp, testNamespace, testName, apiToken, [{
          filepath: configFile,
          filename: testFilename,
          contentType: testContentType,
        }]),
      }

      const runId = await postRun(nestTestingApp, testNamespace, body, apiToken)
      await checkRun(nestTestingApp, runId)

      await completeRun(nestTestingApp, testNamespace, runId, apiToken, RunResult.Red)
      await checkRepositoryEntriesCount(nestTestingApp.repositories.findingRepository, runId * expectedEntries)

      const findings = (
        await supertest
          .agent(httpServer)
          .get(
            `/api/v1/namespaces/${testNamespace.namespace.id}/findings?page=1&items=20&sortOrder=DESC&sortBy=id`,
          )
          .set('Accept', 'application/json')
          .set('Authorization', `Bearer ${apiToken}`)
      ).body.data

      const result = await supertest
        .agent(httpServer)
        .get(
          `/api/v1/namespaces/${testNamespace.namespace.id}/findings/${findings[0].id}`,
        )
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)

      expect(result).toBeDefined()
      expect(result.body).toHaveProperty('id')
      expect(result.body).toHaveProperty('uniqueIdHash')
      expect(result.body).toHaveProperty('status')
    })

    it('should return the finding matching the criteria', async () => {
      const expectedEntries = 10

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

      await checkRepositoryEntriesCount(nestTestingApp.repositories.findingRepository, 0)
      const body = {
        configId: await createConfigWithFiles(nestTestingApp, testNamespace, testName, apiToken, [{
          filepath: configFile,
          filename: testFilename,
          contentType: testContentType,
        }]),
      }

      const runId = await postRun(nestTestingApp, testNamespace, body, apiToken)
      await checkRun(nestTestingApp, runId)

      await completeRun(nestTestingApp, testNamespace, runId, apiToken, RunResult.Red)
      await checkRepositoryEntriesCount(nestTestingApp.repositories.findingRepository, runId * expectedEntries)

      const findings = (
        await supertest
          .agent(httpServer)
          .get(
            `/api/v1/namespaces/${testNamespace.namespace.id}/findings?page=1&items=20&sortOrder=DESC&sortBy=id`,
          )
          .set('Accept', 'application/json')
          .set('Authorization', `Bearer ${apiToken}`)
      ).body.data

      for (const finding of findings) {
        const result = await supertest
          .agent(httpServer)
          .get(
            `/api/v1/namespaces/${testNamespace.namespace.id}/findings/${finding.id}`,
          )
          .set('Accept', 'application/json')
          .set('Authorization', `Bearer ${apiToken}`)

        expect(result).toBeDefined()
        expect(result.body.id).toBe(finding.id)
        expect(result.body.uniqueIdHash).toBe(finding.uniqueIdHash)
        expect(result.body.status).toBe('unresolved')
      }
    })
  })

  describe('PATCH finding', () => {
    it('should update a finding matching the criteria', async () => {
      const expectedEntries = 10
      const expectedResolved = 1
      const expectedUnresolved = 9
      const expectedOccurrenceCount = 1

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

      await checkRepositoryEntriesCount(nestTestingApp.repositories.findingRepository, 0)
      const body = {
        configId: await createConfigWithFiles(nestTestingApp, testNamespace, testName, apiToken, [{
          filepath: configFile,
          filename: testFilename,
          contentType: testContentType,
        }]),
      }

      const runId = await postRun(nestTestingApp, testNamespace, body, apiToken)
      await checkRun(nestTestingApp, runId)

      await completeRun(nestTestingApp, testNamespace, runId, apiToken, RunResult.Red)
      await checkRepositoryEntriesCount(nestTestingApp.repositories.findingRepository, runId * expectedEntries)

      const findings = (
        await supertest
          .agent(httpServer)
          .get(
            `/api/v1/namespaces/${testNamespace.namespace.id}/findings?page=1&items=20&sortOrder=DESC&sortBy=id`,
          )
          .set('Accept', 'application/json')
          .set('Authorization', `Bearer ${apiToken}`)
      ).body.data

      // resolve finding manually
      const patchBody = {
        status: 'resolved',
        resolvedComment: 'Resolved by integration test',
        resolver: testNamespace.users[0].id,
      }
      await supertest
        .agent(httpServer)
        .patch(
          `/api/v1/namespaces/${testNamespace.namespace.id}/findings/${findings[0].id}`,
        )
        .send(patchBody)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)
        .expect(HttpStatus.OK)

      const result = await supertest
        .agent(httpServer)
        .get(
          `/api/v1/namespaces/${testNamespace.namespace.id}/findings?page=1&items=20&sortOrder=DESC&sortBy=id`,
        )
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)

      expect(
        countFindingsWithStatus(result.body.data, StatusType.UNRESOLVED),
      ).toBe(expectedUnresolved)
      expect(
        countFindingsWithStatus(result.body.data, StatusType.RESOLVED),
      ).toBe(expectedResolved)
      expect(countFindingsWithManualResolveFlag(result.body.data, true)).toBe(
        expectedResolved,
      )
      checkFindingsOccurrenceCount(result.body.data, expectedOccurrenceCount)
    })
  })

  it('should update a finding and accept mail address as user', async () => {
    const expectedEntries = 10

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

    await checkRepositoryEntriesCount(nestTestingApp.repositories.findingRepository, 0)
    const body = {
      configId: await createConfigWithFiles(nestTestingApp, testNamespace, testName, apiToken, [{
        filepath: configFile,
        filename: testFilename,
        contentType: testContentType,
      }]),
    }

    const runId = await postRun(nestTestingApp, testNamespace, body, apiToken)
    await checkRun(nestTestingApp, runId)

    await completeRun(nestTestingApp, testNamespace, runId, apiToken, RunResult.Red)
    await checkRepositoryEntriesCount(nestTestingApp.repositories.findingRepository, runId * expectedEntries)

    const findings = (
      await supertest
        .agent(httpServer)
        .get(
          `/api/v1/namespaces/${testNamespace.namespace.id}/findings?page=1&items=20&sortOrder=DESC&sortBy=id`,
        )
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)
    ).body.data

    // resolve finding manually
    const patchBody = {
      status: 'resolved',
      resolvedComment:
        'Resolved by integration test for user mail to displayname check',
      resolver: testNamespace.users[0].email,
    }
    const result = await supertest
      .agent(httpServer)
      .patch(
        `/api/v1/namespaces/${testNamespace.namespace.id}/findings/${findings[0].id}`,
      )
      .send(patchBody)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${apiToken}`)
      .expect(HttpStatus.OK)

    expect(result.body.resolver.username).toBe(testNamespace.users[0].username)
  })

  describe('DELETE finding', () => {
    it('should delete a finding matching the criteria', async () => {
      const expectedInitialEntries = 10
      const expectedResultingEntries = 9
      const expectedResolved = 0
      const expectedUnresolved = 9
      const expectedOccurrenceCount = 1

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

      await checkRepositoryEntriesCount(nestTestingApp.repositories.findingRepository, 0)
      const body = {
        configId: await createConfigWithFiles(nestTestingApp, testNamespace, testName, apiToken, [{
          filepath: configFile,
          filename: testFilename,
          contentType: testContentType,
        }]),
      }

      const runId = await postRun(nestTestingApp, testNamespace, body, apiToken)
      await checkRun(nestTestingApp, runId)

      await completeRun(nestTestingApp, testNamespace, runId, apiToken, RunResult.Red)
      await checkRepositoryEntriesCount(nestTestingApp.repositories.findingRepository, runId * expectedInitialEntries)

      const findings = (
        await supertest
          .agent(httpServer)
          .get(
            `/api/v1/namespaces/${testNamespace.namespace.id}/findings?page=1&items=20&sortOrder=DESC&sortBy=id`,
          )
          .set('Accept', 'application/json')
          .set('Authorization', `Bearer ${apiToken}`)
      ).body.data

      // delete finding
      await supertest
        .agent(httpServer)
        .delete(
          `/api/v1/namespaces/${testNamespace.namespace.id}/findings/${findings[0].id}`,
        )
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)
        .expect(HttpStatus.OK)

      const result = await supertest
        .agent(httpServer)
        .get(
          `/api/v1/namespaces/${testNamespace.namespace.id}/findings?page=1&items=20&sortOrder=DESC&sortBy=id`,
        )
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${apiToken}`)

      await checkRepositoryEntriesCount(nestTestingApp.repositories.findingRepository, runId * expectedResultingEntries)
      expect(result.statusCode).toBe(HttpStatus.OK)
      expect(result.body.pagination.totalCount).toBe(
        runId * expectedResultingEntries,
      )
      expect(
        countFindingsWithStatus(result.body.data, StatusType.UNRESOLVED),
      ).toBe(expectedUnresolved)
      expect(
        countFindingsWithStatus(result.body.data, StatusType.RESOLVED),
      ).toBe(expectedResolved)
      checkFindingsOccurrenceCount(result.body.data, expectedOccurrenceCount)
    })
  })

  async function checkFindingsRunId(runId: number) {
    const findingsEntity: Finding[] =
      await nestTestingApp.repositories.findingRepository.find()

    findingsEntity.forEach((finding) =>
      expect(finding).toHaveProperty('runId', runId),
    )
  }

  function checkFindingsOccurrenceCount(
    findings: GetFindingDTO[],
    expectedCount: number,
  ) {
    findings.forEach((finding: GetFindingDTO) =>
      expect(finding).toHaveProperty('occurrenceCount', expectedCount),
    )
  }

  function countFindingsWithStatus(
    findings: GetFindingDTO[],
    status: StatusType,
  ): number {
    return findings.reduce((total: number, item: GetFindingDTO) => {
      if (item.status == status) {
        return total + 1
      }
      return total
    }, 0)
  }

  function countFindingsWithManualResolveFlag(
    findings: GetFindingDTO[],
    status: boolean,
  ): number {
    return findings.reduce((total: number, item: GetFindingDTO) => {
      if (item.resolver && item.resolvedManually == status) {
        return total + 1
      }
      return total
    }, 0)
  }

  function saveFindingsMetadata(
    findings: GetFindingDTO[],
  ): Map<string, string> {
    const metadata: Map<string, string> = new Map()
    findings.forEach((item: GetFindingDTO) =>
      metadata.set(item.uniqueIdHash, JSON.stringify(item.metadata)),
    )

    return metadata
  }

  function checkFindingsMetadata(
    findings: GetFindingDTO[],
    originalMetadata: Map<any, any>,
    expectedMetadata: Map<any, any>,
  ) {
    findings.forEach((finding: GetFindingDTO) => {
      expect(JSON.stringify(finding.metadata)).toBe(
        expectedMetadata.get(originalMetadata.get(finding.uniqueIdHash)),
      )
    })
  }
})
