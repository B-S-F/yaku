import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Environment, EnvironmentFacade } from '../cli/environment-utils'
import { RunProcessResult } from '../cli/process'
import { EOL } from 'os'
import { MockServer, ServerHost } from '../cli/mockserver'
import { loginMockServerResponse } from '../fixtures/login-server-response'

const testYakurc = '.yakurc-test'
const yakuCliExecutable: string = `${__dirname}/../../dist/index.js`

describe('Integration tests for envs', async () => {
  const port: number = 8080
  const serverHost: ServerHost = new ServerHost(
    'http',
    'localhost',
    String(port),
    '/api/v1'
  )
  const testHost = serverHost.getApiEndpoint()

  const testToken = 'dummyToken'

  const envs: Environment[] = [
    {
      name: 'env1',
      url: testHost,
      token: testToken,
      namespaceId: 1,
    },
    {
      name: 'env2',
      url: testHost,
      token: testToken,
      namespaceId: 1,
    },
  ]

  const mockServerEnvironmentOptions = loginMockServerResponse(port)
  let mockServer: MockServer | undefined

  const envManager = new EnvironmentFacade(yakuCliExecutable, testYakurc)

  describe('Environments list', async () => {
    beforeEach(async () => {
      for (const env of envs) {
        mockServer = new MockServer(mockServerEnvironmentOptions)
        await envManager.createEnvironment(env)
        await mockServer?.stop()
        mockServer = undefined
      }
    })

    afterEach(async () => {
      for (const env of envs) {
        await envManager.deleteEnvironment(env.name)
      }
    })

    it('lists correctly the available environments', async () => {
      const result: RunProcessResult = await envManager.runCommand('list -j')
      const expectedData = [
        {
          name: 'env1',
          url: testHost,
          accessToken: testToken,
          current: false,
          namespace: 1,
        },
        {
          name: 'env2',
          url: testHost,
          accessToken: testToken,
          current: true,
          namespace: 1,
        },
      ]
      const stdoutObject = JSON.parse(result.stdout)
      stdoutObject.sort((a: any, b: any) => a.name.localeCompare(b.name))
      expect(result.exitCode).toEqual(0)
      expect(result.stderr).toEqual('')
      expect(stdoutObject.length).toBe(2)
      expect(stdoutObject).toEqual(expectedData)
    })

    it('shows help message for list command', async () => {
      const result: RunProcessResult = await envManager.runCommand('list -h')

      const expectedMessage: string[] = [
        'Usage: yaku environments list|ls [options]',
        'List all available environments',
        'Options:',
        '  -j, --json  Output as JSON',
        '  -h, --help  display help for command',
      ]

      const stdoutArray: string[] = result.stdout
        .split(EOL)
        .filter((line) => line.length > 0)

      expect(stdoutArray).toEqual(expectedMessage)
      expect(result.stderr).toEqual('')
    })
  })

  describe('Environment switch', async () => {
    beforeEach(async () => {
      for (const env of envs) {
        mockServer = new MockServer(mockServerEnvironmentOptions)
        await envManager.createEnvironment(env)
        await mockServer?.stop()
        mockServer = undefined
      }
    })

    afterEach(async () => {
      for (const env of envs) {
        await envManager.deleteEnvironment(env.name)
      }
    })

    it('switches environment', async () => {
      await envManager.runCommand('switch env1')
      const result: RunProcessResult = await envManager.listEnvironments()

      const expectedData = [
        {
          name: 'env1',
          url: testHost,
          accessToken: testToken,
          current: true,
          namespace: 1,
        },
        {
          name: 'env2',
          url: testHost,
          accessToken: testToken,
          current: false,
          namespace: 1,
        },
      ]

      const stdoutObject = JSON.parse(result.stdout)
      expect(Array.isArray(stdoutObject)).to.be.true
      expect(result.stderr).toEqual('')
      expect(stdoutObject.length).toBe(2)
      expect(stdoutObject).toEqual(expectedData)
    })

    it('shows help message for switch command', async () => {
      const result: RunProcessResult = await envManager.runCommand('switch -h')

      const expectedMessage: string[] = [
        'Usage: yaku environments switch|sw [options] [envName]',
        'Switch to a different environment',
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

  describe('Environment create', async () => {
    it('creates an environment correctly', async () => {
      const env: Environment = envs[0]
      mockServer = new MockServer(mockServerEnvironmentOptions)
      await envManager.createEnvironment(env)
      await mockServer?.stop()
      mockServer = undefined
      const result: RunProcessResult = await envManager.listEnvironments()

      const expectedData = [
        {
          name: env.name,
          url: env.url,
          accessToken: env.token,
          current: true,
          namespace: env.namespaceId,
        },
      ]
      const stdoutObject = JSON.parse(result.stdout)
      expect(Array.isArray(stdoutObject)).to.be.true
      expect(result.stderr).toEqual('')
      expect(stdoutObject.length).toBe(1)
      expect(stdoutObject).toEqual(expectedData)
      await envManager.deleteEnvironment(stdoutObject[0].name)
    })

    it('shows help message for create command', async () => {
      const result: RunProcessResult = await envManager.runCommand('create -h')

      const expectedMessage: string[] = [
        'Usage: yaku environments create|c [options] <envName>',
        'Create a new Yaku CLI environment',
        'Arguments:',
        '  envName                      Name of the Yaku CLI environment',
        'Options:',
        '  -u, --url <url>              URL of the Yaku instance',
        '  -n, --namespace <namespace>  Yaku namespace to use',
        '  -w, --web                    Login via web browser',
        '  -t, --token [token]          Access token for the Yaku instance',
        '  -h, --help                   display help for command',
      ]

      const stdoutArray: string[] = result.stdout
        .split(EOL)
        .filter((line) => line.length > 0)

      expect(stdoutArray).toEqual(expectedMessage)
      expect(result.stderr).toEqual('')
    })
  })

  describe('Environment delete', async () => {
    it('deletes an environment correctly', async () => {
      mockServer = new MockServer(mockServerEnvironmentOptions)
      await envManager.createEnvironment(envs[0])

      await envManager.deleteEnvironment('env1')
      await mockServer?.stop()
      mockServer = undefined

      // The created environment should be deleted
      const result: RunProcessResult = await envManager.listEnvironments()

      const expectedData = []

      const stdoutObject = JSON.parse(result.stdout)
      expect(Array.isArray(stdoutObject)).to.be.true
      expect(result.stderr).toEqual('')
      expect(stdoutObject.length).toBe(0)
      expect(stdoutObject).toEqual(expectedData)
    })

    it('shows help message for delete command', async () => {
      const result: RunProcessResult = await envManager.runCommand('delete -h')

      const expectedMessage: string[] = [
        'Usage: yaku environments delete [options] [envName]',
        'Delete a Yaku CLI environment',
        'Arguments:',
        '  envName     Name of the Yaku CLI environment',
        'Options:',
        '  -h, --help  display help for command',
      ]

      const stdoutArray: string[] = result.stdout
        .split(EOL)
        .filter((line) => line.length > 0)

      expect(stdoutArray).toEqual(expectedMessage)
      expect(result.stderr).toEqual('')
    })

    it('fails to delete inexistent environment', async () => {
      const result: RunProcessResult = await envManager.runCommand(
        'delete inexistent-env'
      )

      expect(result.exitCode).toEqual(0)
      expect(result.stderr).toContain(`Environment 'inexistent-env' not found!`)
    })
  })

  describe('Environment update', async () => {
    beforeEach(async () => {
      for (const env of envs) {
        mockServer = new MockServer(mockServerEnvironmentOptions)
        await envManager.createEnvironment(env)
        await mockServer?.stop()
        mockServer = undefined
      }
    })

    afterEach(async () => {
      for (const env of envs) {
        await envManager.deleteEnvironment(env.name)
      }
    })

    it('updates an environment correctly', async () => {
      await envManager.updateEnvironmentField(
        'env1',
        'url',
        'http://new-url/api/v1'
      )

      const result: RunProcessResult = await envManager.listEnvironments()

      const expectedData = [
        {
          name: 'env1',
          url: 'http://new-url/api/v1',
          accessToken: testToken,
          current: false,
          namespace: 1,
        },
        {
          name: 'env2',
          url: testHost,
          accessToken: testToken,
          current: true,
          namespace: 1,
        },
      ]

      const stdoutObject = JSON.parse(result.stdout)
      expect(Array.isArray(stdoutObject)).to.be.true
      expect(result.stderr).toEqual('')
      expect(stdoutObject.length).toBe(2)
      expect(stdoutObject).toEqual(expectedData)
    })

    it('shows help message for update command', async () => {
      const result: RunProcessResult = await envManager.runCommand('update -h')

      const expectedMessage: string[] = [
        'Usage: yaku environments update|upd [options] <envName> <key> <value>',
        'Update an existing environment',
        'Arguments:',
        '  envName     Name of the environment',
        `  key         Key of the environment property, either 'name', 'url', 'token',`,
        `              or 'namespace'`,
        '  value       Value for the specified key',
        'Options:',
        '  -h, --help  display help for command',
        '  Aliases:',
        '    update | upd | set | u',
        '        ',
      ]

      const stdoutArray: string[] = result.stdout
        .split(EOL)
        .filter((line) => line.length > 0)

      expect(stdoutArray).toEqual(expectedMessage)
      expect(result.stderr).toEqual('')
    })
    it('fails to update inexistent field', async () => {
      const result = await envManager.updateEnvironmentField(
        'env1',
        'inexistent-field',
        'newValue'
      )

      expect(result.exitCode).toEqual(0)
      expect(result.stderr).toContain(
        `Invalid key 'inexistent-field'. Key must be either 'name', 'url', 'token', or 'namespace'.`
      )
    })
    it('fails to update inexistent environment', async () => {
      const result = await envManager.updateEnvironmentField(
        'inexistent-env',
        'url',
        'newValue'
      )

      expect(result.exitCode).toEqual(0)
      expect(result.stderr).toContain(`Environment 'inexistent-env' not found!`)
    })
  })
  describe('Environment help', async () => {
    it('shows environment help message', async () => {
      const result: RunProcessResult = await envManager.runCommand('help')

      const expectedMessage: string[] = [
        'Usage: yaku environments|envs [options] [command]',
        'Manage environments',
        'Options:',
        '  -h, --help                          display help for command',
        'Commands:',
        '  update|upd <envName> <key> <value>  Update an existing environment',
        '  list|ls [options]                   List all available environments',
        '  edit|e                              Edit environments config file in external',
        '                                      text editor',
        '  switch|sw [envName]                 Switch to a different environment',
        '  create|c [options] <envName>        Create a new Yaku CLI environment',
        '  delete [envName]                    Delete a Yaku CLI environment',
        '  help [command]                      display help for command',
      ]

      const stdoutArray: string[] = result.stdout
        .split(EOL)
        .filter((line) => line.length > 0)

      expect(stdoutArray).toEqual(expectedMessage)
      expect(result.stderr).toEqual('')
    })
  })
})
