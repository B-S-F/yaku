import { HttpStatus } from '@nestjs/common'
import { DefaultBodyType, MockedRequest } from 'msw'
import { SetupServer, setupServer } from 'msw/node'
import * as supertest from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Run, RunStatus } from '../src/namespace/run/run.entity'
import { SecretStorage } from '../src/namespace/secret/secret-storage.service'
import {
  BlobStore,
  MinIOStoreImpl,
} from '../src/namespace/workflow/minio.service'
import { handlers } from './mocks'
import { NamespaceTestEnvironment, NestTestingApp, NestUtil } from './util'

const timeoutInMillis = 5000

const config = `header:
  name: PerformanceTest_Fibonacci
  version: '1.1'
metadata:
  version: 'v1'

autopilots:
  validateSomething:
    run: |
      echo '{ "status": "GREEN" }'
      echo '{ "reason": "Everything is awesome" }'
      echo '{ "result": { "criterion": "Awesomeness check", "fulfilled": true, "justification": "Everything is awesome" } }'
chapters:
  '1':
    title: Test config should work
    requirements:
      '1':
        title: Awesomeness Requirement
        checks:
          '1':
            title: Awesomeness compute
            automation:
                autopilot: validateSomething
`

const v0Config = `header:
  name: Test
  version: "1.1"
`

describe('POST run', () => {
  let testNamespace: NamespaceTestEnvironment

  let server: SetupServer
  let allRequests: MockedRequest<DefaultBodyType>[] = []
  let nestTestingApp: NestTestingApp

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
    ).mockImplementation(() => Promise.resolve())
  })

  afterEach(async () => {
    server.close()
    await nestTestingApp.app.close()
  })

  it('should do a roundtrip with runs', async () => {
    await createConfiguration(config)
    await checkDatabaseEntities(0)

    const body = {
      configId,
    }
    const runId = await postRun(body)

    await checkRunByGET(runId)
    await awaitPending(runId)

    await checkDatabase(runId)
    await checkDatabaseEntities(1)

    await waitForRequests(3)
    expect(
      allRequests.filter((req) => req.method === 'POST'),
      `Argo post requests are not as expected`
    ).length(1)
    expect(
      allRequests.filter((req) => req.method === 'GET').length,
      `Argo get requests are not as expected`
    ).toBeGreaterThanOrEqual(1)
    await checkArgoRequest(allRequests[0], {})
  })

  it('start run with envs', async () => {
    await createConfiguration(config)
    await checkDatabaseEntities(0)

    const body = {
      configId: configId,
      environment: {
        EMPTY_VALUE: '',
        VALUE_WITH_WHITESPACE: 'Something with spaces in between',
        NUMERIC_VALUE: '123456',
      },
    }
    const runId = await postRun(body)

    await checkRunByGET(runId)
    await awaitPending(runId)

    await checkDatabase(runId)
    await checkDatabaseEntities(1)

    await waitForRequests(3)
    expect(
      allRequests.filter((req) => req.method === 'POST'),
      `Argo post requests are not as expected`
    ).length(1)
    expect(
      allRequests.filter((req) => req.method === 'GET').length,
      `Argo get requests are not as expected`
    ).toBeGreaterThanOrEqual(1)
    await checkArgoRequest(allRequests[0], {})
  })

  it('start run with a single check', async () => {
    await createConfiguration(config)
    await checkDatabaseEntities(0)

    const body = {
      configId: configId,
      singleCheck: {
        chapter: '1',
        requirement: '1',
        check: '1',
      },
    }
    const runId = await postRun(body)

    await checkRunByGET(runId)
    await awaitPending(runId)

    await checkDatabase(runId)
    await checkDatabaseEntities(1)

    await waitForRequests(3)
    const requests = allRequests.filter((req) => req.method === 'POST')
    expect(requests, `Argo post requests are not as expected`).length(1)
    expect(await requests[0].text()).toContain('-c 1_1_1')

    expect(
      allRequests.filter((req) => req.method === 'GET').length,
      `Argo get requests are not as expected`
    ).toBeGreaterThanOrEqual(1)
  })

  it('fail run with unsupported v0 format', async () => {
    await createConfiguration(v0Config)
    await checkDatabaseEntities(0)

    const body = {
      configId: configId,
    }
    const runId = await postRun(body)

    // We expect the run to fail immediately due to the unsupported config
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const response = await supertest
      .agent(nestTestingApp.app.getHttpServer())
      .get(`/api/v1/namespaces/${testNamespace.namespace.id}/runs/${runId}`)
      .set('Authorization', `Bearer ${apiToken}`)
      .expect(HttpStatus.OK)

    expect(response.body.status, `Run in GET response has not failed`).toEqual(
      RunStatus.Failed
    )

    expect(response.body.log).toBeDefined()
    const log = response.body.log

    const oneLineErrorMessage = log.join(' ') as string

    expect(oneLineErrorMessage).toContain('Unknown format')
    expect(oneLineErrorMessage).toContain('Error')
  })

  async function checkDatabase(runId: number): Promise<void> {
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

  async function checkDatabaseEntities(expectedNumber: number): Promise<void> {
    expect(
      await nestTestingApp.repositories.runRepository.count(),
      `Expected ${expectedNumber} elements in database`
    ).toBe(expectedNumber)
  }

  async function awaitPending(runId: number): Promise<void> {
    let run = await getRun(runId)
    while (run.status === RunStatus.Pending) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      run = await getRun(runId)
    }
  }

  async function checkRunByGET(runId: number): Promise<void> {
    const response = await getRun(runId)
    expect(
      response.body.id,
      `Run in GET response has not the right id`
    ).toBeDefined()
    expect(
      response.body.status,
      `Run in GET response has not the right status`
    ).oneOf([RunStatus.Running, RunStatus.Pending])
    expect(
      response.body.config,
      `Config reference in run of GET reference is not as expected`
    ).match(/^.*\/namespaces\/\d+\/configs\/\d+$/)
  }

  async function getRun(runId: number): Promise<any> {
    return await supertest
      .agent(nestTestingApp.app.getHttpServer())
      .get(`/api/v1/namespaces/${testNamespace.namespace.id}/runs/${runId}`)
      .set('Authorization', `Bearer ${apiToken}`)
      .expect(HttpStatus.OK)
  }

  async function checkArgoRequest(
    request: MockedRequest<DefaultBodyType>,
    expectedEnvs: { [s: string]: any }
  ): Promise<void> {
    const requestBody: any = await request.json()
    const env: { name: string; value: string }[] =
      requestBody.Workflow.spec.templates[0].script.env
    expect(
      Array.isArray(env),
      `Expected an array for environment variables`
    ).toBe(true)

    for (const element of env) {
      expect(
        Object.keys(expectedEnvs),
        `The given environment variables sent to argo do not contain variable ${element.name}`
      ).contains(element.name)
      expect(
        element.value,
        `The given environment variables sent to argo do not contain the content of variable ${element.name}`
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
          setTimeout(resolve, pollIntervalInMillis)
        )
        passedTimeInMillis = Date.now() - startTimeInMillis
      }
      resolve()
    })
  }

  async function postRun(body: any): Promise<number> {
    const response = await supertest
      .agent(nestTestingApp.app.getHttpServer())
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

  async function createConfiguration(config: string): Promise<void> {
    const response = await supertest
      .agent(nestTestingApp.app.getHttpServer())
      .post(`/api/v1/namespaces/${testNamespace.namespace.id}/configs`)
      .send({ name: 'Test Config' })
      .set('Authorization', `Bearer ${apiToken}`)
      .set('Content-Type', 'application/json')
      .expect(HttpStatus.CREATED)

    configId = response.body.id

    await supertest
      .agent(nestTestingApp.app.getHttpServer())
      .post(
        `/api/v1/namespaces/${testNamespace.namespace.id}/configs/${configId}/files`
      )
      .field('filename', 'qg-config.yaml')
      .attach('content', Buffer.from(config), {
        filename: 'qg-config.yaml',
        contentType: 'application/yaml',
      })
      .set('Authorization', `Bearer ${apiToken}`)
      .expect(HttpStatus.CREATED)
  }
})
