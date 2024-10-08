import * as fs from 'fs'
import { EOL } from 'os'
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest'
import { createRunMockServerResponse } from '../fixtures/create-run-mock-server-response'
import { Environment, EnvironmentFacade } from '../cli/environment-utils'
import { MockServer, ReceivedRequest, ServerHost } from '../cli/mockserver'
import { run, RunProcessResult } from '../cli/process'
import { CommandFacade } from '../cli/utils'
import { loginMockServerResponse } from '../fixtures/login-server-response'

const testYakurc = '.yakurc-test'
const yakuCliExecutable: string = `${__dirname}/../../dist/index.js`
const cmdManager: CommandFacade = new CommandFacade(
  yakuCliExecutable,
  testYakurc
)
const envManager: EnvironmentFacade = new EnvironmentFacade(
  yakuCliExecutable,
  testYakurc
)

describe('Integration tests for create runs', async () => {
  const port: number = 8080
  const serverHost: ServerHost = new ServerHost(
    'http',
    'localhost',
    String(port),
    '/api/v1'
  )
  const namespaceId = 1
  const environment: Environment = {
    name: 'test-env',
    url: serverHost.getApiEndpoint(),
    token: Buffer.from('dummyToken', 'binary').toString('base64'),
    namespaceId: namespaceId,
  }

  const configId: string = '1'
  const runId: number = Number(configId)
  let command: string

  const mockServerOptions = createRunMockServerResponse(
    parseInt(serverHost.getPort()),
    namespaceId,
    runId
  )

  const mockServerEnvironmentOptions = loginMockServerResponse(port)
  let mockServer: MockServer | undefined

  beforeAll(async () => {
    expect(fs.existsSync(yakuCliExecutable)).to.be.true
    mockServer = new MockServer(mockServerEnvironmentOptions)
    await envManager.createEnvironment(environment)
    await mockServer?.stop()
    mockServer = undefined
  })

  afterAll(async () => {
    await envManager.deleteEnvironment(environment.name)
  })

  afterEach(async () => {
    await mockServer?.stop()
    mockServer = undefined
  })

  describe('Overwriting environment variables on create a run', async () => {
    beforeEach(async () => {
      command = `runs create ${configId}`
    })

    it('env variable given without key; expect: to throw error that incorrect format is used, no request is sent out and exit code == 1', async () => {
      command = `${command} -e testKey`

      const result: RunProcessResult = await cmdManager.runCommand(command)

      const expectedErrorMsg: string[] = [
        'Error: You provided additional environment variables but in the wrong format. Correct: KEY1 VALUE1 KEY2 VALUE2 ...',
        'Usage: yaku runs|r [options] [command]',
        'Manage qg runs',
        'Options:',
        '  -h, --help                     display help for command',
        'Commands:',
        '  list|ls [options] [page]       List runs in pages',
        '  show|s [options] <runId>       Show data of a specific run',
        '  create|c [options] <configId>  Start the execution of a run',
        '  result|res <runId>             Download the result file of a run',
        '  evidences|ev <runId>           Download the evidences file of a run',
        '  delete <runId>                 Delete a finished run',
        '  help [command]                 display help for command',
      ]

      mockServer = new MockServer(mockServerOptions)

      verifyErrorOutput(result, expectedErrorMsg)

      expect(mockServer.getNumberOfRequests()).to.equal(0)
    })

    it('env variable given with blank key; expect to throw error that key is blank, no request is sent and exit code == 1', async () => {
      command = `${command} --environment ${''} VALUE`

      const result = await cmdManager.runCommand(command)

      const expectedErrorMsg: string[] = [
        'Error: You provided an environment variable with an empty key',
        'Usage: yaku runs|r [options] [command]',
        'Manage qg runs',
        'Options:',
        '  -h, --help                     display help for command',
        'Commands:',
        '  list|ls [options] [page]       List runs in pages',
        '  show|s [options] <runId>       Show data of a specific run',
        '  create|c [options] <configId>  Start the execution of a run',
        '  result|res <runId>             Download the result file of a run',
        '  evidences|ev <runId>           Download the evidences file of a run',
        '  delete <runId>                 Delete a finished run',
        '  help [command]                 display help for command',
      ]

      mockServer = new MockServer(mockServerOptions)

      verifyErrorOutput(result, expectedErrorMsg)

      expect(mockServer.getNumberOfRequests()).to.equal(0)
    })

    it('add env variables and run without --wait option; expect post request to include added variables and 1 request is sent.', async () => {
      const envOptions = `--environment addedKey addedValue addedKey2 addedValue2 addedKey3 ${''}`
      command = `${command} ${envOptions}`

      const mockServerOptions = createRunMockServerResponse(
        parseInt(serverHost.getPort()),
        namespaceId,
        runId
      )
      mockServer = new MockServer(mockServerOptions)

      const result = await cmdManager.runCommand(command)
      verifyRequest(envOptions.split(' '), namespaceId)

      expect(mockServer.getNumberOfRequests()).to.equal(1)

      expect(result.exitCode).to.equal(0)
    })

    it('add env variables and run with --wait option; expect post request to include added variables and 1 request is sent.', async () => {
      const envOptions: string = `--wait --environment addedKey addedValue`

      const pollOptions: string = `--poll-interval 1`

      command = `${command} ${envOptions} ${pollOptions}`

      const mockServerOptions = createRunMockServerResponse(
        parseInt(serverHost.getPort()),
        namespaceId,
        runId
      )

      mockServer = new MockServer(mockServerOptions)

      const result = await cmdManager.runCommand(command)
      verifyRequest(envOptions.split(' '), namespaceId)

      expect(mockServer.getNumberOfRequests()).to.equal(2)

      expect(result.exitCode).to.equal(0)
    })

    it('run with --wait option and poll-interval; expect to take at least poll-interval time', async () => {
      const pollOptions: string = `--wait --poll-interval 3`

      command = `${command} ${pollOptions}`
      const mockServerOptions = createRunMockServerResponse(
        parseInt(serverHost.getPort()),
        namespaceId,
        runId
      )

      mockServer = new MockServer(mockServerOptions)

      const startTime = Date.now()
      const result = await cmdManager.runCommand(command)
      const endTime = Date.now()

      expect(mockServer.getNumberOfRequests()).to.equal(2)
      expect(endTime - startTime).to.be.greaterThan(3000)
      expect(result.exitCode).to.equal(0)
    }, 10000)
  })
  /**
   * Evaluates the prompted error code and message
   */
  function verifyErrorOutput(
    result: RunProcessResult,
    expectedErrorMessage: string[]
  ) {
    const stdout = result.stderr.split(EOL).filter((line) => line.length > 0)

    expect(stdout).toEqual(expectedErrorMessage)
    expect(result.exitCode).to.equal(1)
  }

  /**
   * Evaluates whether the outgoing HTTP request includes the added variables
   */
  function verifyRequest(envOptions: string[], namespaceId: number): void {
    let envObject: { [key: string]: string } = {}

    let i = envOptions.includes('--wait') ? 2 : 1

    for (i; i < envOptions.length; i += 2) {
      envObject[envOptions[i]] = envOptions[i + 1]
    }

    const expectedCreateResourceRequest = {
      configId: Number(configId),
      environment: envObject,
    }

    const createResourceRequest: ReceivedRequest[] = mockServer!.getRequests(
      `/api/v1/namespaces/${namespaceId}/runs`,
      'post'
    )
    const getRunStatus: ReceivedRequest[] = mockServer!.getRequests(
      `/api/v1/namespaces/${namespaceId}/runs/${runId}`,
      'get'
    )

    const actualCreateResourceRequestBody = createResourceRequest[0].body

    expect(createResourceRequest).to.have.length(1)
    expect(getRunStatus).to.have.length(envOptions.includes('--wait') ? 1 : 0)
    expect(actualCreateResourceRequestBody).toEqual(
      expectedCreateResourceRequest
    )
  }
})
