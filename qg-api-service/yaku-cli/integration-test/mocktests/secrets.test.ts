import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
} from 'vitest'
import { Environment, EnvironmentFacade } from '../cli/environment-utils'
import { CommandFacade } from '../cli/utils'
import * as fs from 'fs'
import { MockServer, ServerHost } from '../cli/mockserver'
import { createSecretsMockServerResponse } from '../fixtures/create-secrets-mock-server-response'
import { EOL } from 'os'
import { RunProcessResult } from '../cli/process'
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

describe('Integration tests for secrets', async () => {
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

  const customDate: string = '2024-02-09T06:26:18.933Z'

  beforeAll(async () => {
    mockServer = new MockServer(mockServerEnvironmentOptions)
    expect(fs.existsSync(yakuCliExecutable)).to.be.true
    await envManager.createEnvironment(environment)
    await mockServer?.stop()
    mockServer = undefined
  })

  afterAll(async () => {
    await envManager.deleteEnvironment(environment.name)
  })

  describe('Secrets list', async () => {
    const mockServerOptions = createSecretsMockServerResponse(1, port)
    let mockServer: MockServer | undefined

    beforeAll(async () => {
      mockServer = new MockServer(mockServerOptions)
    })

    afterAll(async () => {
      await mockServer?.stop()
      mockServer = undefined
    })

    it('should return the list of secrets', async () => {
      const command = 'secrets list'

      const result: RunProcessResult = await cmdManager.runCommand(command)

      const expectedData = {
        pagination: {
          pageNumber: 1,
          pageSize: 20,
          totalCount: 2,
        },
        data: [
          {
            name: 'GITHUB_TOKEN',
            description: 'Github Token',
            creationTime: customDate,
            lastModificationTime: customDate,
          },
          {
            name: 'ARTIFACTORY_USERNAME',
            description: 'Artifactory Username',
            creationTime: customDate,
            lastModificationTime: customDate,
          },
        ],
        links: {
          first: `${serverHost.getApiEndpoint()}/namespaces/${
            environment.namespaceId
          }/secrets?page=1&items=20`,
          last: `${serverHost.getApiEndpoint()}/namespaces/${
            environment.namespaceId
          }/secrets?page=1&items=20`,
          next: `${serverHost.getApiEndpoint()}/namespaces/${
            environment.namespaceId
          }/secrets?page=1&items=20`,
        },
      }

      const stdoutObject = JSON.parse(result.stdout)
      expect(result.exitCode).toEqual(0)
      expect(result.stderr).toEqual('')
      expect(stdoutObject).toEqual(expectedData)
    })

    it('should return a single secret', async () => {
      const command = 'secrets list -i 1'

      const result: RunProcessResult = await cmdManager.runCommand(command)

      const expectedData = {
        pagination: {
          pageNumber: 1,
          pageSize: 20,
          totalCount: 1,
        },
        data: [
          {
            name: 'GITHUB_TOKEN',
            description: 'Github Token',
            creationTime: customDate,
            lastModificationTime: customDate,
          },
        ],
        links: {
          first: `${serverHost.getApiEndpoint()}/namespaces/${
            environment.namespaceId
          }/secrets?page=1&items=1`,
          last: `${serverHost.getApiEndpoint()}/namespaces/${
            environment.namespaceId
          }/secrets?page=2&items=1`,
          next: `${serverHost.getApiEndpoint()}/namespaces/${
            environment.namespaceId
          }/secrets?page=2&items=1`,
        },
      }

      const stdoutObject = JSON.parse(result.stdout)
      expect(result.exitCode).toEqual(0)
      expect(result.stderr).toEqual('')
      expect(stdoutObject).toEqual(expectedData)
    })

    it('should show a help message for list', async () => {
      const result: RunProcessResult = await cmdManager.runCommand(
        'secrets list -h'
      )

      const expectedMessage: string[] = [
        'Usage: yaku secrets list|ls [options] [page]',
        'List all secrets of the namespace',
        'Arguments:',
        '  page                     The page requested, defaults to page 1',
        'Options:',
        '  -i, --itemCount <value>  Number of items requested per page, defaults to 20',
        '  -a, --ascending          Revert sort order for the items',
        '  --all                    Retrieve all secrets in one call',
        '  -s, --sortBy [property]  Sort results by the given property',
        '  -h, --help               display help for command',
      ]

      const stdoutArray: string[] = result.stdout
        .split(EOL)
        .filter((line) => line.length > 0)
      expect(stdoutArray).toEqual(expectedMessage)
      expect(result.stderr).toEqual('')
    })

    it('should fail to list secrets with extra arguments', async () => {
      const result: RunProcessResult = await cmdManager.runCommand(
        'secrets list a b c '
      )

      const expectedMessage: string[] = [
        "too many arguments for 'list'. Expected 1 argument but got 4.",
      ]

      expect(result.stdout).toEqual('')
      expect(result.stderr).toContain(expectedMessage)
    })
  })

  describe('Secrets create', async () => {
    const mockServerOptions = createSecretsMockServerResponse(1, port)
    let mockServer: MockServer | undefined

    beforeAll(async () => {
      mockServer = new MockServer(mockServerOptions)
    })

    afterAll(async () => {
      await mockServer?.stop()
      mockServer = undefined
    })

    it('should create a secret', async () => {
      const command =
        'secrets create TEMP_SEC --secret "some-value" "some-secret"'

      const result = await cmdManager.runCommand(command)

      const expectedData = {
        name: 'TEMP_SEC',
        description: 'some secret',
        creationTime: customDate,
        lastModificationTime: customDate,
      }

      const stdoutObject = JSON.parse(result.stdout)
      expect(result.exitCode).toEqual(0)
      expect(result.stderr).toEqual('')
      expect(stdoutObject).toEqual(expectedData)
    })

    it('should fail to create a secret with invalid name', async () => {
      const command =
        'secrets create temp_sec --secret "some-value" "some-other-secret"'

      const result: RunProcessResult = await cmdManager.runCommand(command)

      const expectedMessage = [
        `Error:`,
        `  Message:       The name of a secret can only contain upper case letters, numbers and underscore. It has to start with a letter or an underscore.`,
        `  Url:           http://localhost:8080/api/v1/namespaces/1/secrets`,
      ]

      const stdoutArray: string[] = result.stdout
        .split(EOL)
        .filter((line) => line.length > 0)
      expect(result.exitCode).toEqual(1)
      expect(result.stderr).toEqual('')
      expect(stdoutArray).toEqual(expectedMessage)
    })

    it('should show a help message for create', async () => {
      const result: RunProcessResult = await cmdManager.runCommand(
        'secrets create -h'
      )

      const expectedMessage: string[] = [
        'Usage: yaku secrets create|c [options] <name> [description]',
        'Create a new secret',
        'Arguments:',
        '  name                   The name of the new secret',
        '  description            An optional description to specify the purpose of the',
        '                         secret',
        'Options:',
        '  -s, --secret <secret>  The secret value to be stored (Deprecated: For',
        '                         security reasons, please use STDIN to input the secret',
        '                         value)',
        '  -h, --help             display help for command',
      ]

      const stdoutArray: string[] = result.stdout
        .split(EOL)
        .filter((line) => line.length > 0)
      expect(stdoutArray).toEqual(expectedMessage)
      expect(result.stderr).toEqual('')
    })
  })
  describe('Secrets update', async () => {
    const mockServerOptions = createSecretsMockServerResponse(
      1,
      port,
      'TEMP_SEC'
    )

    let mockServer: MockServer | undefined

    beforeAll(async () => {
      mockServer = new MockServer(mockServerOptions)
    })

    afterAll(async () => {
      await mockServer?.stop()
      mockServer = undefined
    })

    it('should update a secret', async () => {
      const command =
        'secrets update TEMP_SEC --secret some-val "some-updated-description"'

      const result: RunProcessResult = await cmdManager.runCommand(command)

      const expectedData = {
        name: 'TEMP_SEC',
        description: 'some secret',
        creationTime: '2024-02-09T06:26:18.933Z',
        lastModificationTime: '2024-02-09T06:26:18.933Z',
      }

      const stdoutObject = JSON.parse(result.stdout)
      expect(result.exitCode).toEqual(0)
      expect(result.stderr).toEqual('')
      expect(stdoutObject).toEqual(expectedData)
    })

    it('should show a help message for update', async () => {
      const result: RunProcessResult = await cmdManager.runCommand(
        'secrets update -h'
      )

      const expectedMessage: string[] = [
        'Usage: yaku secrets update|upd [options] <name> [description]',
        'Update a secret',
        'Arguments:',
        '  name                   The name of the secret to be changed',
        '  description            An optional change of the description',
        'Options:',
        '  -s, --secret <secret>  An optional change of the secret value, use empty',
        '                         string to not change the secret (Deprecated: For',
        '                         security reasons, please use STDIN to input the secret',
        '                         value)',
        '  -h, --help             display help for command',
      ]

      const stdoutArray: string[] = result.stdout
        .split(EOL)
        .filter((line) => line.length > 0)
      expect(stdoutArray).toEqual(expectedMessage)
      expect(result.stderr).toEqual('')
    })
  })
  describe('Secrets delete', async () => {
    const mockServerOptions = createSecretsMockServerResponse(
      1,
      port,
      'TEMP_SEC'
    )

    let mockServer: MockServer | undefined

    beforeEach(async () => {
      mockServer = new MockServer(mockServerOptions)
    })

    afterEach(async () => {
      await mockServer?.stop()
      mockServer = undefined
    })

    it('should delete a secret', async () => {
      const command = 'secrets delete TEMP_SEC -y'

      const result: RunProcessResult = await cmdManager.runCommand(command)

      const expectedMessage = [`Secret TEMP_SEC was successfully deleted`]

      const stdoutArray: string[] = result.stdout
        .split(EOL)
        .filter((line) => line.length > 0)
      expect(result.exitCode).toEqual(0)
      expect(result.stderr).toEqual('')
      expect(stdoutArray).toEqual(expectedMessage)
    })

    it('should show a help message for delete', async () => {
      const result: RunProcessResult = await cmdManager.runCommand(
        'secrets delete -h'
      )

      const expectedMessage: string[] = [
        'Usage: yaku secrets delete [options] <name>',
        'Delete a secret',
        'Arguments:',
        '  name        The name of the secret to be changed',
        'Options:',
        '  -y --yes    Skip the confirmation prompt and delete the secret immediately.',
        '              Use with caution!',
        '  -h, --help  display help for command',
      ]

      const stdoutArray: string[] = result.stdout
        .split(EOL)
        .filter((line) => line.length > 0)
      expect(stdoutArray).toEqual(expectedMessage)
      expect(result.stderr).toEqual('')
    })
  })
})
