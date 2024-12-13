// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { HttpStatus } from '@nestjs/common'
import { readFile } from 'fs/promises'
import * as path from 'path'
import { Readable } from 'stream'
import { SetupServer, setupServer } from 'msw/node'
import * as supertest from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RunStatus } from '../src/namespace/run/run.entity'
import { EVIDENCEFILE, RESULTFILE } from '../src/namespace/run/run.service'
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
  awaitPendingRun,
  checkRepositoryEntriesCount,
  checkRun,
  createConfig,
  getRun,
  postRun,
} from './util'

const timeoutInMillis = 5000
const configFile = path.join(__dirname, 'mocks', 'qg-config-awesome.yaml')
const v0ConfigFile = path.join(__dirname, 'mocks', 'qg-config-v0-spec.yaml')

describe('POST run', () => {
  let testNamespace: NamespaceTestEnvironment

  let server: SetupServer
  let allRequests: Request[] = []
  let nestTestingApp: NestTestingApp
  const testName = 'Runs (Integration Test)'
  const testFilename = 'qg-config.yaml'
  const testContentType = 'application/yaml'
  let testContext

  let apiToken
  let configId: number

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
      if (!url.hostname.match(/localhost|127\.0\.0\.1/)) {
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
    ).mockImplementation(() => Promise.resolve())

    testContext = {
      nestTestingApp: nestTestingApp,
      testNamespace: testNamespace,
      apiToken: apiToken,
    }
  })

  afterEach(async () => {
    server.close()
    await nestTestingApp.app.close()
  })

  it('should do a roundtrip with runs', async () => {
    configId = await createConfig(testContext, testName, [
      {
        filepath: configFile,
        filename: testFilename,
        contentType: testContentType,
      },
    ])
    await checkRepositoryEntriesCount(
      nestTestingApp.repositories.runRepository,
      0,
    )

    const body = {
      configId,
    }
    const runId = await postRun(testContext, body)

    await checkRunByGET(runId)
    await awaitPendingRun(testContext, runId)

    await checkRun(nestTestingApp, runId)
    await checkRepositoryEntriesCount(
      nestTestingApp.repositories.runRepository,
      1,
    )

    await waitForRequests(3)
    expect(
      allRequests.filter((req) => req.method === 'POST'),
      `Argo post requests are not as expected`,
    ).length(1)
    expect(
      allRequests.filter((req) => req.method === 'GET').length,
      `Argo get requests are not as expected`,
    ).toBeGreaterThanOrEqual(1)
    await checkArgoRequest(allRequests[0], {})
  })

  it('start run with envs', async () => {
    configId = await createConfig(testContext, testName, [
      {
        filepath: configFile,
        filename: testFilename,
        contentType: testContentType,
      },
    ])
    await checkRepositoryEntriesCount(
      nestTestingApp.repositories.runRepository,
      0,
    )

    const body = {
      configId: configId,
      environment: {
        EMPTY_VALUE: '',
        VALUE_WITH_WHITESPACE: 'Something with spaces in between',
        NUMERIC_VALUE: '123456',
      },
    }
    const runId = await postRun(testContext, body)

    await checkRunByGET(runId)
    await awaitPendingRun(testContext, runId)

    await checkRun(nestTestingApp, runId)
    await checkRepositoryEntriesCount(
      nestTestingApp.repositories.runRepository,
      1,
    )

    await waitForRequests(3)
    expect(
      allRequests.filter((req) => req.method === 'POST'),
      `Argo post requests are not as expected`,
    ).length(1)
    expect(
      allRequests.filter((req) => req.method === 'GET').length,
      `Argo get requests are not as expected`,
    ).toBeGreaterThanOrEqual(1)
    await checkArgoRequest(allRequests[0], {})
  })

  it('start run with a single check', async () => {
    configId = await createConfig(testContext, testName, [
      {
        filepath: configFile,
        filename: testFilename,
        contentType: testContentType,
      },
    ])
    await checkRepositoryEntriesCount(
      nestTestingApp.repositories.runRepository,
      0,
    )

    const body = {
      configId: configId,
      singleCheck: {
        chapter: '1',
        requirement: '1',
        check: '1',
      },
    }
    const runId = await postRun(testContext, body)

    await checkRunByGET(runId)
    await awaitPendingRun(testContext, runId)

    await checkRun(nestTestingApp, runId)
    await checkRepositoryEntriesCount(
      nestTestingApp.repositories.runRepository,
      1,
    )

    await waitForRequests(3)
    const requests = allRequests.filter((req) => req.method === 'POST')
    expect(requests, `Argo post requests are not as expected`).length(1)
    expect(await requests[0].text()).toContain('-c 1_1_1')

    expect(
      allRequests.filter((req) => req.method === 'GET').length,
      `Argo get requests are not as expected`,
    ).toBeGreaterThanOrEqual(1)
  })

  it('should create a synthetic run', async () => {
    configId = await createConfig(testContext, testName, [
      {
        filepath: configFile,
        filename: testFilename,
        contentType: testContentType,
      },
    ])
    await checkRepositoryEntriesCount(
      nestTestingApp.repositories.runRepository,
      0,
    )

    const data = {}
    data[RESULTFILE] = await readFile(
      path.join(__dirname, 'mocks', 'qg-result-10-findings-red-status.yaml'),
    )
    data[EVIDENCEFILE] = Buffer.from('some evidences content')

    const runId = await postSyntheticRun(data)

    await checkRepositoryEntriesCount(
      nestTestingApp.repositories.runRepository,
      1,
    )

    const result = await supertest
      .agent(nestTestingApp.app.getHttpServer())
      .get(
        `/api/v1/namespaces/${testNamespace.namespace.id}/runs/${runId}/results`,
      )
      .set('Authorization', `Bearer ${apiToken}`)
      .expect(HttpStatus.OK)
      .expect('Content-Type', 'application/yaml')
      .expect('Content-Disposition', `attachment; filename="${RESULTFILE}"`)

    expect(result.text).toEqual(data[RESULTFILE].toString('utf-8'))

    const evidences = await supertest
      .agent(nestTestingApp.app.getHttpServer())
      .get(
        `/api/v1/namespaces/${testNamespace.namespace.id}/runs/${runId}/evidences`,
      )
      .set('Authorization', `Bearer ${apiToken}`)
      .expect(HttpStatus.OK)
      .expect('Content-Type', 'application/zip')
      .expect('Content-Disposition', `attachment; filename="${EVIDENCEFILE}"`)

    expect(Buffer.from(evidences.text)).toEqual(data[EVIDENCEFILE])
  })

  it('fail run with unsupported v0 format', async () => {
    configId = await createConfig(testContext, testName, [
      {
        filepath: v0ConfigFile,
        filename: testFilename,
        contentType: testContentType,
      },
    ])
    await checkRepositoryEntriesCount(
      nestTestingApp.repositories.runRepository,
      0,
    )

    const body = {
      configId: configId,
    }
    const runId = await postRun(testContext, body)

    // We expect the run to fail immediately due to the unsupported config
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const response = await supertest
      .agent(nestTestingApp.app.getHttpServer())
      .get(`/api/v1/namespaces/${testNamespace.namespace.id}/runs/${runId}`)
      .set('Authorization', `Bearer ${apiToken}`)
      .expect(HttpStatus.OK)

    expect(response.body.status, `Run in GET response has not failed`).toEqual(
      RunStatus.Failed,
    )

    expect(response.body.log).toBeDefined()
    const log = response.body.log

    const oneLineErrorMessage = log.join(' ') as string

    expect(oneLineErrorMessage).toContain('Unknown format')
    expect(oneLineErrorMessage).toContain('Error')
  })

  async function checkRunByGET(runId: number): Promise<void> {
    const response = await getRun(testContext, runId)
    expect(
      response.body.id,
      `Run in GET response has not the right id`,
    ).toBeDefined()
    expect(
      response.body.status,
      `Run in GET response has not the right status`,
    ).oneOf([RunStatus.Running, RunStatus.Pending])
    expect(
      response.body.config,
      `Config reference in run of GET reference is not as expected`,
    ).match(/^.*\/namespaces\/\d+\/configs\/\d+$/)
  }

  async function checkArgoRequest(
    request: Request,
    expectedEnvs: { [s: string]: any },
  ): Promise<void> {
    const requestBody: any = await request.json()
    const env: { name: string; value: string }[] =
      requestBody.Workflow.spec.templates[0].script.env
    expect(
      Array.isArray(env),
      `Expected an array for environment variables`,
    ).toBe(true)

    for (const element of env) {
      expect(
        Object.keys(expectedEnvs),
        `The given environment variables sent to argo do not contain variable ${element.name}`,
      ).contains(element.name)
      expect(
        element.value,
        `The given environment variables sent to argo do not contain the content of variable ${element.name}`,
      ).toEqual(expectedEnvs[element.name])
    }
  }

  async function waitForRequests(expectedNumberOfRequests = 1): Promise<void> {
    const pollIntervalInMillis = 500
    const startTimeInMillis: number = Date.now()
    let passedTimeInMillis = 0

    return new Promise(async (resolve) => {
      while (passedTimeInMillis < timeoutInMillis) {
        if (allRequests.length >= expectedNumberOfRequests) {
          resolve()
          return
        }

        await new Promise((resolve) =>
          setTimeout(resolve, pollIntervalInMillis),
        )
        passedTimeInMillis = Date.now() - startTimeInMillis
      }
      resolve()
    })
  }

  async function postSyntheticRun(data: {
    [filename: string]: string | Buffer
  }): Promise<number> {
    const response = await supertest
      .agent(nestTestingApp.app.getHttpServer())
      .post(
        `/api/v1/namespaces/${testNamespace.namespace.id}/runs/synthetic?configId=${configId}`,
      )
      .field('filename', `${RESULTFILE},${EVIDENCEFILE}`)
      .attach('content', Buffer.from(data[RESULTFILE]), {
        filename: RESULTFILE,
        contentType: 'multipart/form-data',
      })
      .attach('content', Buffer.from(data[EVIDENCEFILE]), {
        filename: EVIDENCEFILE,
        contentType: 'multipart/form-data',
      })
      .set('Authorization', `Bearer ${apiToken}`)
      .expect(HttpStatus.ACCEPTED)

    expect(
      response.body.id,
      `The id of created run does not exist`,
    ).toBeDefined()
    expect(
      response.headers.location.endsWith(`${response.body.id}`),
      `The location header of created run is not as expected`,
    ).toBeTruthy()
    expect(
      response.body.status,
      `The status of created run is not as expected, it is ${response.body.status}`,
    ).toBe(RunStatus.Completed)
    expect(
      response.body.config,
      `The config ref of created run is not as expected, it is ${response.body.config}`,
    ).match(/^.*\/namespaces\/\d+\/configs\/\d+$/)

    const storagePath = (
      await nestTestingApp.repositories.runRepository.findOneBy({
        id: response.body.id,
      })
    ).storagePath

    vi.spyOn(
      nestTestingApp.testingModule.get<MinIOStoreImpl>(BlobStore),
      'downloadResult',
    ).mockImplementation(
      async (storage: string, filename: string): Promise<Readable> => {
        console.log('storagePath:', storage)
        console.log('filename:', filename)
        let readableStream: Readable
        if (filename === RESULTFILE) {
          const buffer = Buffer.from(data[RESULTFILE])
          readableStream = new Readable({
            read() {
              this.push(buffer, 'utf-8')
              this.push(null)
            },
          })
        } else if (filename === EVIDENCEFILE) {
          const buffer = Buffer.from(data[EVIDENCEFILE])
          readableStream = new Readable({
            read() {
              this.push(buffer)
              this.push(null)
            },
          })
        }

        return Promise.resolve(readableStream)
      },
    )

    return response.body.id
  }
})
