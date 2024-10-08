import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { RunProcessResult } from '../cli/process'
import { EOL } from 'os'
import { CommandFacade } from '../cli/utils'
import { MockServer, ReceivedRequest, ServerHost } from '../cli/mockserver'
import { Environment, EnvironmentFacade } from '../cli/environment-utils'
import { loginMockServerResponse } from '../fixtures/login-server-response'
import { createFilesMockServerResponse } from '../fixtures/create-files-mock-server-response'
import path from 'path'
import * as fs from 'fs'

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

const testingEnvName = 'env1'
const testingNamespaceId = 1
const testingConfigId = 1
const testingFilename = 'testingFilename'
const testingDirectory = 'testingDirectory'

describe('Integration tests for files help', async () => {
  it('correctly calls the help command', async () => {
    const result: RunProcessResult = await cmdManager.runCommand('files help')

    const expectedMessage: string[] = [
      'Usage: yaku files|f [options] [command]',
      'Manage files of a config',
      'Options:',
      '  -h, --help                                  display help for command',
      'Commands:',
      '  list|ls <configId>                          List the file of a config',
      '  add|a [options] <configId> <filepath>       Add a file to a config',
      '  update|upd [options] <configId> <filepath>  Update the file content of a file in a config',
      '  download|dl <configId> <filename>           Download the file content of a config file',
      '  delete [options] <configId> [filenames...]  Delete files from a config',
      '  sync-up [options] <configId> <directory>    Upload all files from a local directory into the config. Will not recurse into subdirectories. Will overwrite existing files!',
      '  sync-down [options] <configId> <directory>  Download all files from a config into a local directory.',
      '  sync [options] <srcPath> <dstPath>          Downloads all files from a source config and uploads them into a destination config (can be from the same or different enviroments and/or namespaces). Does not recurse into subdirectories. Overwrites existing files!',
      '  help [command]                              display help for command',
    ]

    const stdoutArray: string[] = result.stdout
      .split(EOL)
      .filter((line) => line.length > 0)

    expect(stdoutArray).toEqual(expectedMessage)
    expect(result.stderr).toEqual('')
  })
})

describe('Integration tests for files commands', async () => {
  const port: number = 8080
  const serverHost: ServerHost = new ServerHost(
    'http',
    'localhost',
    String(port),
    '/api/v1'
  )

  const environment: Environment = {
    name: testingEnvName,
    url: serverHost.getApiEndpoint(),
    token: Buffer.from('dummyToken', 'binary').toString('base64'),
    namespaceId: testingNamespaceId,
  }

  const mockServerEnvironmentOptions = loginMockServerResponse(port)

  let mockServer: MockServer | undefined

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

  describe('Files list', async () => {
    const mockServerOptions = createFilesMockServerResponse(
      testingNamespaceId,
      testingConfigId,
      port
    )
    let mockServer: MockServer | undefined

    beforeAll(async () => {
      mockServer = new MockServer(mockServerOptions)
    })

    afterAll(async () => {
      await mockServer?.stop()
      mockServer = undefined
    })

    it('should return the list of files that belong to a config', async () => {
      const command = `files list ${testingConfigId}`

      const result: RunProcessResult = await cmdManager.runCommand(command)

      const expectedStdout = {
        qgConfig: `https://yaku-dev.bswf.tech/api/v1/namespaces/${testingNamespaceId}/configs/${testingConfigId}/files/${testingFilename}`,
      }

      const stdoutObject = JSON.parse(result.stdout)
      expect(result.exitCode).toEqual(0)
      expect(result.stderr).toHaveLength(0)
      expect(stdoutObject).toEqual(expectedStdout)
    })
  })

  describe('Add a new files', async () => {
    const mockServerOptions = createFilesMockServerResponse(
      testingNamespaceId,
      testingConfigId,
      port
    )
    let mockServer: MockServer | undefined

    beforeAll(async () => {
      mockServer = new MockServer(mockServerOptions)
      fs.writeFileSync(testingFilename, 'dummyContents')
    })

    afterAll(async () => {
      await mockServer?.stop()
      mockServer = undefined
      fs.rmSync(testingFilename, { force: true })
    })

    it('should add a new file to an existing config', async () => {
      const command = `files add ${testingConfigId} ${testingFilename}`

      const result: RunProcessResult = await cmdManager.runCommand(command)
      const receivedRequests: ReceivedRequest[] | undefined =
        await mockServer?.getRequests(
          `/api/v1/namespaces/${testingNamespaceId}/configs/${testingConfigId}/files`,
          'post'
        )

      const expectedStdout = `File ${testingFilename} uploaded\n`
      const undiciRegex = /[0-9]{12}/g
      const expectedFormData =
        '------formdata-undici-000000000000\r\n' +
        'Content-Disposition: form-data; name="filename"\r\n\r\n' +
        'testingFilename\r\n' +
        '------formdata-undici-000000000000\r\n' +
        'Content-Disposition: form-data; name="content"; filename="blob"\r\n' +
        'Content-Type: application/octet-stream\r\n\r\n' +
        'dummyContents\r\n' +
        '------formdata-undici-000000000000--'

      expect(result.exitCode).toEqual(0)
      expect(result.stderr).toHaveLength(0)
      expect(result.stdout).toEqual(expectedStdout)
      expect(receivedRequests?.length).toBe(1)
      expect(receivedRequests![0].headers['content-type']).toContain(
        'multipart/form-data; boundary=----formdata-undici-'
      )
      expect(receivedRequests![0].headers['content-length']).toEqual(
        expectedFormData.length.toString()
      )
      expect(
        receivedRequests![0].multipartData.replace(undiciRegex, '000000000000')
      ).toEqual(expectedFormData)
    })
  })

  describe('Update an exiting file', async () => {
    const mockServerOptions = createFilesMockServerResponse(
      testingNamespaceId,
      testingConfigId,
      port,
      testingFilename
    )
    let mockServer: MockServer | undefined

    beforeAll(async () => {
      mockServer = new MockServer(mockServerOptions)
      fs.writeFileSync(testingFilename, 'dummyContents')
    })

    afterAll(async () => {
      await mockServer?.stop()
      mockServer = undefined
      fs.rmSync(testingFilename, { force: true })
    })

    it('should update an existing file of an existing config', async () => {
      const command = `files update ${testingConfigId} ${testingFilename}`

      const result: RunProcessResult = await cmdManager.runCommand(command)
      const receivedRequests: ReceivedRequest[] | undefined =
        await mockServer?.getRequests(
          `/api/v1/namespaces/${testingNamespaceId}/configs/${testingConfigId}/files/${testingFilename}`,
          'patch'
        )

      const expectedStdout = `File ${testingFilename} replaced\n`
      const undiciRegex = /[0-9]{12}/g
      const expectedFormData =
        '------formdata-undici-000000000000\r\n' +
        'Content-Disposition: form-data; name="content"; filename="blob"\r\n' +
        'Content-Type: application/octet-stream\r\n\r\n' +
        'dummyContents\r\n' +
        '------formdata-undici-000000000000--'

      expect(result.exitCode).toEqual(0)
      expect(result.stderr).toEqual('')
      expect(result.stdout).toEqual(expectedStdout)
      expect(receivedRequests?.length).toBe(1)
      expect(receivedRequests![0].headers['content-type']).toContain(
        'multipart/form-data; boundary=----formdata-undici-'
      )
      expect(receivedRequests![0].headers['content-length']).toEqual(
        expectedFormData.length.toString()
      )
      expect(
        receivedRequests![0].multipartData.replace(undiciRegex, '000000000000')
      ).toEqual(expectedFormData)
    })
  })

  describe('Download an existing file', async () => {
    const mockServerOptions = createFilesMockServerResponse(
      testingNamespaceId,
      testingConfigId,
      port,
      testingFilename
    )
    let mockServer: MockServer | undefined

    beforeAll(async () => {
      mockServer = new MockServer(mockServerOptions)
    })

    afterAll(async () => {
      await mockServer?.stop()
      mockServer = undefined
      fs.rmSync(testingFilename, { force: true })
    })

    it('should download an existing file of an existing config', async () => {
      const command = `files download ${testingConfigId} ${testingFilename}`

      const result: RunProcessResult = await cmdManager.runCommand(command)

      const expectedStdout = `Wrote file ${testingFilename}\n`
      const expectedFileContents = new Buffer('binary')

      expect(result.exitCode).toEqual(0)
      expect(result.stderr).toHaveLength(0)
      expect(result.stdout).toEqual(expectedStdout)
      expect(fs.readFileSync(testingFilename)).toStrictEqual(
        expectedFileContents
      )
      expect(mockServer?.getNumberOfRequests()).toBe(1)
    })
  })

  describe('Delete an existing file', async () => {
    const mockServerOptions = createFilesMockServerResponse(
      testingNamespaceId,
      testingConfigId,
      port,
      testingFilename
    )
    let mockServer: MockServer | undefined

    beforeAll(async () => {
      mockServer = new MockServer(mockServerOptions)
    })

    afterAll(async () => {
      await mockServer?.stop()
      mockServer = undefined
    })

    it('should delete an existing file of an existing config', async () => {
      const command = `files delete -y ${testingConfigId} ${testingFilename}`

      const result: RunProcessResult = await cmdManager.runCommand(command)

      expect(result.exitCode).toEqual(0)
      expect(result.stderr).toHaveLength(0)
      expect(result.stdout).toHaveLength(0)
      expect(mockServer?.getNumberOfRequests()).toBe(1)
    })
  })

  describe('Sync-down existing files', async () => {
    const mockServerOptions = createFilesMockServerResponse(
      testingNamespaceId,
      testingConfigId,
      port,
      testingFilename
    )
    let mockServer: MockServer | undefined

    beforeAll(async () => {
      mockServer = new MockServer(mockServerOptions)
      fs.mkdirSync(testingDirectory)
    })

    afterAll(async () => {
      await mockServer?.stop()
      mockServer = undefined
      fs.rmSync(testingDirectory, { recursive: true, force: true })
    })

    it('should download existing files of an existing config', async () => {
      const command = `files sync-down -y ${testingConfigId} ${testingDirectory}`

      const result: RunProcessResult = await cmdManager.runCommand(command)

      const expectedStdout = 'Downloading 1 file(s)...\n'

      expect(result.exitCode).toEqual(0)
      expect(result.stderr).toHaveLength(0)
      expect(result.stdout).toEqual(expectedStdout)
      expect(fs.readdirSync(testingDirectory).length).toBe(1)
      expect(fs.existsSync(path.join(testingDirectory, testingFilename))).toBe(
        true
      )
      expect(mockServer?.getNumberOfRequests()).toBe(2)
    })
  })

  describe('Sync-up existing files', async () => {
    const mockServerOptions = createFilesMockServerResponse(
      testingNamespaceId,
      testingConfigId,
      port,
      testingFilename
    )
    let mockServer: MockServer | undefined

    beforeAll(async () => {
      mockServer = new MockServer(mockServerOptions)
      fs.mkdirSync(testingDirectory)
      fs.writeFileSync(
        path.join(testingDirectory, testingFilename),
        'dummyContents'
      )
    })

    afterAll(async () => {
      await mockServer?.stop()
      mockServer = undefined
      fs.rmSync(testingDirectory, { recursive: true, force: true })
    })

    it('should upload existing files for an existing config', async () => {
      const command = `files sync-up ${testingConfigId} ${testingDirectory}`

      const result: RunProcessResult = await cmdManager.runCommand(command)

      const expectedStdout = `{\n  "qgConfig": "https://yaku-dev.bswf.tech/api/v1/namespaces/${testingNamespaceId}/configs/${testingConfigId}/files/${testingFilename}"\n}\n`

      expect(result.exitCode).toEqual(0)
      expect(result.stderr).toHaveLength(0)
      expect(result.stdout).toEqual(expectedStdout)
      expect(mockServer?.getNumberOfRequests()).toBe(3)
    })
  })

  describe('Sync from source config into destination config', async () => {
    const mockServerOptions = createFilesMockServerResponse(
      testingNamespaceId,
      testingConfigId,
      port,
      testingFilename
    )
    let mockServer: MockServer | undefined

    beforeAll(async () => {
      mockServer = new MockServer(mockServerOptions)
    })

    afterAll(async () => {
      await mockServer?.stop()
      mockServer = undefined
    })

    it('should sync the 2 configs', async () => {
      const command = `files sync --skip-secrets ${testingConfigId} ${testingConfigId}`

      const result: RunProcessResult = await cmdManager.runCommand(command)

      const uuidV4Regex =
        /[a-zA-Z0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12}/g

      const expectedStdout =
        'Creating temp directory /tmp/yaku-cli-file-sync-${RANDOM_UUID}\n' +
        'Starting sync-down from source environment...\n' +
        'Downloading 1 file(s)...\n' +
        'Download complete.\n' +
        'Starting sync-up into the destination environment...\n' +
        `{\n  "qgConfig": "https://yaku-dev.bswf.tech/api/v1/namespaces/${testingNamespaceId}/configs/${testingConfigId}/files/${testingFilename}"\n}\n` +
        'Removing temp directory /tmp/yaku-cli-file-sync-${RANDOM_UUID}\n'

      expect(result.exitCode).toEqual(0)
      expect(result.stderr).toHaveLength(0)
      expect(result.stdout.replace(uuidV4Regex, '${RANDOM_UUID}')).toEqual(
        expectedStdout
      )
      expect(mockServer?.getNumberOfRequests()).toBe(5)
    })
  })
})
