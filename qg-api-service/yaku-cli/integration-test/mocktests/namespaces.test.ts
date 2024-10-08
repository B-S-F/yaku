import { Environment, EnvironmentFacade } from '../cli/environment-utils'
import { MockServer, ServerHost } from '../cli/mockserver'
import { CommandFacade } from '../cli/utils'
import * as fs from 'fs'
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
} from 'vitest'
import { createNamespacesMockServerResponse } from '../fixtures/create-namespaces-mock-server-response'
import { RunProcessResult } from '../cli/process'
import { EOL } from 'os'
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

describe('Integration tests for namespaces', async () => {
  const port: number = 8080
  const serverHost: ServerHost = new ServerHost(
    'http',
    'localhost',
    String(port),
    '/api/v1'
  )

  const environment: Environment = {
    name: 'test-env',
    url: serverHost.getApiEndpoint(),
    token: Buffer.from('dummyToken', 'binary').toString('base64'),
    namespaceId: 1,
  }

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

  describe('Namespaces list', async () => {
    const mockServerOptions = createNamespacesMockServerResponse(port)
    let mockServer: MockServer | undefined

    beforeEach(async () => {
      mockServer = new MockServer(mockServerOptions)
    })

    afterEach(async () => {
      await mockServer?.stop()
      mockServer = undefined
    })

    it('should list namespaces', async () => {
      const result: RunProcessResult = await cmdManager.runCommand(
        `namespaces list`
      )

      const expectedData = [
        {
          id: 1,
          name: 'namespace1',
          users: [],
        },
        {
          id: 2,
          name: 'namespace2',
          users: [],
        },
      ]

      const stdoutObject = JSON.parse(result.stdout)
      expect(result.exitCode).toEqual(0)
      expect(result.stderr).toEqual('')
      expect(stdoutObject).toEqual(expectedData)
    })

    it('shows a help message for namespaces list', async () => {
      const result: RunProcessResult = await cmdManager.runCommand(
        'namespaces list -h'
      )

      const expectedMessage: string[] = [
        'Usage: yaku namespaces list|ls [options]',
        'List all namespaces visible for given user',
        'Options:',
        '  -h, --help  display help for command',
      ]

      const stdoutArray: string[] = result.stdout
        .split(EOL)
        .filter((line) => line.length > 0)
      expect(stdoutArray).toEqual(expectedMessage)
      expect(result.stderr).toEqual('')
    })
  })

  describe('Namespaces switch', async () => {
    const mockServerOptions = createNamespacesMockServerResponse(port)
    let mockServer: MockServer | undefined

    beforeEach(async () => {
      mockServer = new MockServer(mockServerOptions)
    })

    afterEach(async () => {
      await mockServer?.stop()
      mockServer = undefined
    })

    it('should switch namespaces', async () => {
      await cmdManager.runCommand(`namespaces sw 2`)
      const result: RunProcessResult = await envManager.listEnvironments()

      const expectedData = [
        {
          name: 'test-env',
          url: 'http://localhost:8080/api/v1',
          accessToken: 'ZHVtbXlUb2tlbg==',
          namespace: 2,
          current: true,
        },
      ]
      const stdoutObject = JSON.parse(result.stdout)

      expect(Array.isArray(stdoutObject)).to.be.true
      expect(result.stderr).toEqual('')
      expect(stdoutObject.length).toBe(1)
      expect(stdoutObject).toEqual(expectedData)
    })

    it('should not switch to an inexistent namespace', async () => {
      const result: RunProcessResult = await cmdManager.runCommand(
        `namespaces sw 3`
      )

      const expectedMessage: string[] = [
        `Namespace with id 3 not found. Use 'namespaces list' to see available namespaces.`,
      ]

      const stdoutArray: string[] = result.stderr
        .split(EOL)
        .filter((line) => line.length > 0)

      expect(result.exitCode).toEqual(0)
      expect(stdoutArray).toEqual(expectedMessage)
    })

    it('should show a help messages for switch namespace', async () => {
      const result: RunProcessResult = await cmdManager.runCommand(
        'namespaces sw -h'
      )

      const expectedMessage: string[] = [
        'Usage: yaku namespaces switch|sw [options] [namespaceId]',
        'Switch to a different namespace',
        'Options:',
        '  -h, --help  display help for command',
      ]

      const stdoutArray: string[] = result.stdout
        .split(EOL)
        .filter((line) => line.length > 0)
      expect(stdoutArray).toEqual(expectedMessage)
      expect(result.stderr).toEqual('')
    })
  })

  describe('Namespaces create', async () => {
    const mockServerOptions = createNamespacesMockServerResponse(port)
    let mockServer: MockServer | undefined

    beforeAll(async () => {
      mockServer = new MockServer(mockServerOptions)
    })

    afterAll(async () => {
      await mockServer?.stop()
      mockServer = undefined
    })

    it('should create a new namespace', async () => {
      const result: RunProcessResult = await cmdManager.runCommand(
        `namespaces create namespace3`
      )

      const expectedData = [
        {
          id: 3,
          name: 'namespace3',
          users: [],
        },
      ]

      const stdoutObject = JSON.parse(result.stdout)
      expect(result.exitCode).toEqual(0)
      expect(result.stderr).toEqual('')
      expect(stdoutObject).toEqual(expectedData)
    })
  })

  describe('Namespaces help', async () => {
    it('should show a help message for namespaces', async () => {
      const result: RunProcessResult = await cmdManager.runCommand(
        'namespaces -h'
      )

      const expectedMessage: string[] = [
        'Usage: yaku namespaces|ns [options] [command]',
        'Manage namespaces',
        'Options:',
        '  -h, --help                            display help for command',
        'Commands:',
        '  list|ls                               List all namespaces visible for given',
        '                                        user',
        '  switch|sw [namespaceId]               Switch to a different namespace',
        '  create|c [options] <name> [users...]  Create a new namespace (admin access',
        '                                        required)',
        '  show|s <id>                           Show a specific namespace',
        '  update|upd [options] <id>             Update a namespace (admin access',
        '                                        required)',
        '  help [command]                        display help for command',
      ]

      const stdoutArray: string[] = result.stdout
        .split(EOL)
        .filter((line) => line.length > 0)
      expect(stdoutArray).toEqual(expectedMessage)
      expect(result.stderr).toEqual('')
    })
  })
})
