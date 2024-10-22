import * as fs from 'fs'
import * as path from 'path'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  MockServer,
  ReceivedRequest,
  run,
  RunProcessResult,
} from '../../../../integration-tests/src/util'
import {
  defaultAdoEnvironment,
  adoFetcherExecutable,
  evidencePath,
  mockServerPort,
  verifyNoOutputFileWasWritten,
} from './common'
import { getAdoFixtures } from './fixtures/ado-fixtures'

describe('Ado Fetcher', () => {
  let mockServer: MockServer

  beforeAll(() => {
    expect(fs.existsSync(adoFetcherExecutable)).to.be.true
  })

  beforeEach(() => {
    fs.mkdirSync(evidencePath)
    mockServer = new MockServer(getAdoFixtures(mockServerPort))
  })

  afterEach(async () => {
    await mockServer?.stop()
    fs.rmSync(evidencePath, { recursive: true })
  })

  it.each([
    'evidence_path',
    'ADO_CONFIG_FILE_PATH',
    'ADO_API_ORG',
    'ADO_API_PROJECT',
    'ADO_API_PERSONAL_ACCESS_TOKEN',
  ])(
    `should fail when env variable %s is not set`,
    async (variableName: string) => {
      const forbiddenValues = ['', ' ', '\t', '\n'] as const

      for (const forbiddenValue of forbiddenValues) {
        const env = {
          ...defaultAdoEnvironment,
          ...{ [variableName]: forbiddenValue },
        }
        const result: RunProcessResult = await run(adoFetcherExecutable, [], {
          env,
        })

        expect(result.exitCode).toEqual(1)
        expect(result.stderr.length).toBeGreaterThan(0)
        const expectedErrorMessage = `AppError [EnvironmentError]: The environment variable "${variableName}" is not set!`
        expect(result.stderr[0]).toEqual(expectedErrorMessage)
        expect(mockServer.getNumberOfRequests()).toEqual(0)
        verifyNoOutputFileWasWritten()
      }
    }
  )

  it('should fail when no work items were returned by ADO', async () => {
    await mockServer.stop()
    mockServer = new MockServer({
      port: mockServerPort,
      https: true,
      responses: {
        '/adoApiOrg/adoApiProject/_apis/wit/wiql': {
          post: {
            responseStatus: 200,
            responseBody: {
              workItems: [],
            },
          },
        },
      },
    })

    const result: RunProcessResult = await run(adoFetcherExecutable, [], {
      env: defaultAdoEnvironment,
    })

    expect(result.exitCode).toEqual(1)
    expect(result.stdout).length(0)
    expect(result.stderr.length).toBeGreaterThan(0)
    expect(result.stderr[0]).toEqual(
      'AppError [WorkItemsNotFoundError]: No work items found!'
    )
    expect(mockServer.getNumberOfRequests()).toEqual(1)
    verifyNoOutputFileWasWritten()
  })

  it('should fail when ADO WIQL endpoint returns 404', async () => {
    await mockServer.stop()
    mockServer = new MockServer({
      port: mockServerPort,
      https: true,
      responses: {
        '/adoApiOrg/adoApiProject/_apis/wit/wiql': {
          post: {
            responseStatus: 404,
          },
        },
      },
    })

    const result: RunProcessResult = await run(adoFetcherExecutable, [], {
      env: defaultAdoEnvironment,
    })

    expect(result.exitCode).toEqual(1)
    expect(result.stdout).length(0)
    expect(result.stderr.length).toBeGreaterThan(0)
    expect(result.stderr[0]).toContain('Request failed with status code 404')
    expect(mockServer.getNumberOfRequests()).toEqual(1)
    verifyNoOutputFileWasWritten()
  })

  it('should succeed when config file contains a WIQL query', async () => {
    const result: RunProcessResult = await run(adoFetcherExecutable, [], {
      env: {
        ...defaultAdoEnvironment,
        ADO_CONFIG_FILE_PATH: path.join(
          __dirname,
          'fixtures',
          'config-wiql.yaml'
        ),
      },
    })

    // verify process terminated successfully
    expect(result.exitCode).toEqual(0)
    expect(result.stdout).length(0)
    expect(result.stderr).length(0)

    // only verify WIQL request
    const requests: ReceivedRequest[] = mockServer.getRequests(
      '/adoApiOrg/adoApiProject/_apis/wit/wiql',
      'post'
    )
    expect(requests).length(1)
    expect(requests[0].headers.authorization).toEqual('Basic OnBhdA==')
    expect(requests[0].query['api-version']).toEqual('6.0')
    expect(requests[0].body).toEqual({
      query: 'SELECT [System.Id] FROM workitems',
    })
  })

  it('should succeed when config file contains no WIQL query', async () => {
    const result: RunProcessResult = await run(adoFetcherExecutable, [], {
      env: defaultAdoEnvironment,
    })

    // verify process terminated successfully
    expect(result.exitCode).toEqual(0)
    expect(result.stdout).length(0)
    expect(result.stderr).length(0)

    // verify requests were sent correctly
    function verifyRequests(receivedRequests: ReceivedRequest[]): void {
      expect(receivedRequests).length(1)
      expect(receivedRequests[0].headers.authorization).toEqual(
        'Basic OnBhdA=='
      )
      expect(receivedRequests[0].query['api-version']).toEqual('6.0')
    }
    let requests: ReceivedRequest[] = mockServer.getRequests(
      '/adoApiOrg/adoApiProject/_apis/wit/wiql',
      'post'
    )
    verifyRequests(requests)
    expect(requests[0].body).toEqual({})

    // work items 1, 2, 4 are requested once
    const workItemIds: number[] = [1, 2, 4]
    workItemIds.forEach((workItemId) => {
      requests = mockServer.getRequests(
        `/adoApiOrg/adoApiProject/_apis/wit/workitems/${workItemId}`,
        'get'
      )
      verifyRequests(requests)
      expect(requests[0].query['$expand']).toEqual('relations')
    })

    // work item 3 is requested twice
    requests = mockServer.getRequests(
      '/adoApiOrg/adoApiProject/_apis/wit/workitems/3',
      'get'
    )
    expect(requests).length(2)
    expect(requests[0]).toEqual(requests[1])
    expect(requests[0].headers.authorization).toEqual('Basic OnBhdA==')
    expect(requests[0].query['api-version']).toEqual('6.0')
    expect(requests[0].query['$expand']).toEqual('relations')

    // finally verify no more requests than those verified above have been sent
    expect(mockServer.getNumberOfRequests()).toEqual(6)

    // verify output file was written correctly
    const outputFile: string = path.join(evidencePath, 'data.json')
    const outputFileContentAsString: string = fs.readFileSync(outputFile, {
      encoding: 'utf-8',
    })
    const outputFileContentAsJson: unknown = JSON.parse(
      outputFileContentAsString
    )

    expect(outputFileContentAsJson).toEqual({
      workItems: [
        {
          id: 1,
          url: '',
          foo: 'fooW1',
          bar: 'barW1',
          state: 'stateW1',
          title: 'titleW1',
          relations: [
            {
              id: 2,
              url: '',
              relationType: 'Related',
              foo: 'fooW2',
              bar: 'barW2',
              state: 'stateW2',
              title: 'titleW2',
              relations: [
                {
                  id: 3,
                  url: '',
                  relationType: 'Related',
                  foo: 'fooW3',
                  bar: 'barW3',
                  state: 'stateW3',
                  title: 'titleW3',
                  relations: [],
                },
              ],
            },
            {
              id: 3,
              url: '',
              relationType: 'Related',
              foo: 'fooW3',
              bar: 'barW3',
              state: 'stateW3',
              title: 'titleW3',
              relations: [],
            },
          ],
        },
      ],
    })
  })
})
