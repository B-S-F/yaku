import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
} from 'vitest'
import * as fs from 'fs'
import { RunProcessResult, run } from '../cli/process'
import { EOL } from 'os'
import { MockServer, ServerHost } from '../cli/mockserver'
import { createInfoMockServerResponse } from '../fixtures/create-info-mock-server-response'
import { Environment, EnvironmentFacade } from '../cli/environment-utils'
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

describe('Integration tests for about', async () => {
  it('should return the about information', async () => {
    const command = 'about'
    const result: RunProcessResult = await cmdManager.runCommand(command)

    const expectedMessage: string[] = [
      'Yaku Client CLI',
      'Copyright Bosch Software Flow',
      `Use option '--sbom' to get further details on used open source components`,
    ]

    const stdoutArray: string[] = result.stdout
      .split(EOL)
      .filter((line) => line.length > 0)
    expect(stdoutArray).toEqual(expectedMessage)
    expect(result.stderr).toEqual('')
  })
})

describe('Integration tests for info', async () => {
  const port: number = 8080
  const serverHost: ServerHost = new ServerHost(
    'http',
    'localhost',
    String(port),
    '/api/v1'
  )
  const mockServerOptions = createInfoMockServerResponse(port)
  const mockServerEnvironmentOptions = loginMockServerResponse(port)
  let mockServer: MockServer | undefined

  const environment: Environment = {
    name: 'test-env',
    url: serverHost.getApiEndpoint(),
    token: Buffer.from('dummyToken', 'binary').toString('base64'),
    namespaceId: 9,
  }

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

  beforeEach(async () => {
    mockServer = new MockServer(mockServerOptions)
  })

  afterEach(async () => {
    await mockServer?.stop()
    mockServer = undefined
  })

  it('correctly calls the info command', async () => {
    const result: RunProcessResult = await cmdManager.runCommand('info')

    const expectedData = {
      imageVersion:
        'growpatcrdev.azurecr.io/yaku-core-api-dev:2024-06-12_16-08-47-ebb6281',
      serviceVersion: '0.45.1',
      qgcliVersions: {
        v0: '',
        v1: '2024-06-03_08-15-25-442de8c',
      },
    }
    const stdoutObject = JSON.parse(result.stdout)
    expect(result.exitCode).toEqual(0)
    expect(result.stderr).toEqual('')
    expect(stdoutObject).toEqual(expectedData)
  })

  it('should fail to call the info command for extra arguments ', async () => {
    const result: RunProcessResult = await cmdManager.runCommand('info a b c')
    const expectedMessage =
      "too many arguments for 'info'. Expected 0 arguments but got 3."

    expect(result.stdout).toEqual('')
    expect(result.exitCode).toEqual(1)
    expect(result.stderr).toContain(expectedMessage)
  })

  it('shows help for the info command', async () => {
    const result: RunProcessResult = await cmdManager.runCommand('info -h')

    const expectedMessage: string[] = [
      'Usage: yaku info [options]',
      'Get service info',
      'Options:',
      '  --only <name>  Get only the specified info',
      '  -h, --help     display help for command',
    ]

    const stdoutArray: string[] = result.stdout
      .split(EOL)
      .filter((line) => line.length > 0)
    expect(stdoutArray).toEqual(expectedMessage)
    expect(result.stderr).toEqual('')
  })
})

describe('Integration tests for help', async () => {
  it('correctly calls the help command', async () => {
    const result: RunProcessResult = await cmdManager.runCommand('help')

    const expectedMessage: string[] = [
      'Usage: yaku [options] [command]',
      'CLI for Yaku Service',
      'Options:',
      '  -k, --no-ssl-verify        disable TLS certificate validation',
      '  -h, --help                 display help for command',
      'Commands:',
      '  about [options]            Get information on the cli',
      '  info [options]             Get service info',
      '  login [options] [envName]  Login to the Yaku CLI',
      '  version|V                  Output the current version of the CLI',
      '  environments|envs          Manage environments',
      '  runs|r                     Manage qg runs',
      '  configs|cfg                Manage configs',
      '  files|f                    Manage files of a config',
      '  findings|fnd               Manage findings of a config',
      '  secrets|s                  Manage secrets',
      '  namespaces|ns              Manage namespaces',
      '  tokens|tks                 Manage your user tokens',
      '  help [command]             display help for command',
    ]

    const stdoutArray: string[] = result.stdout
      .split(EOL)
      .filter((line) => line.length > 0)
    expect(stdoutArray).toEqual(expectedMessage)
    expect(result.stderr).toEqual('')
  })
})
