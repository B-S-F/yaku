import { jest } from '@jest/globals'
import { SpiedFunction } from 'jest-mock'
import chalk from 'chalk'
import { _t } from './files'

import {
  ApiClient,
  Config,
  SecretMetadata,
} from '@B-S-F/yaku-client-lib'
import inquirer from 'inquirer'
import { Environment } from './environment'
import fs from 'fs'

// private functions to test
const {
  list,
  add,
  update,
  download,
  deleteFiles,
  syncDown,
  syncUp,
  sync,
  parseSyncPathParameter,
  extractEnvironment,
  extractSecretsList,
  listMissingSecrets,
  cleanupSyncFiles,
} = _t

const env1 = {
  name: 'env1',
  url: 'http://dot2.com/api/v1',
  accessToken: 'acc1',
  refreshToken: 'ref1',
  expiresAt: 1719927052,
  namespace: 1,
  current: true,
}

const env2 = {
  name: 'env2',
  url: 'http://dot2.com/api/v1',
  accessToken: 'acc2',
  refreshToken: 'ref2',
  expiresAt: 1719927052,
  namespace: 1,
  current: false,
}

const env3 = {
  name: 'env3',
  url: 'http://dot3.com/api/v1',
  current: false,
}

const testApiClient = new ApiClient({
  baseUrl: 'http://base.url',
  token: 'token',
})
const testNamespace = 1
const testDirectory = 'dummyDir'
const testEnvHome = '/tmp'

describe('list()', () => {
  let getConfigSpy: any
  beforeEach(() => {
    getConfigSpy = jest
      .spyOn(ApiClient.prototype, 'getConfig')
      .mockResolvedValue({} as Config)
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should call ApiClient.getConfig()', async () => {
    await list(testApiClient, testNamespace, '1')
    expect(getConfigSpy).toHaveBeenCalled()
  })
})

describe('add()', () => {
  let uploadFileToConfigSpy: any
  beforeEach(() => {
    uploadFileToConfigSpy = jest
      .spyOn(ApiClient.prototype, 'uploadFileToConfig')
      .mockResolvedValue()
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should call ApiClient.uploadFileToConfig() with custom filename in options', async () => {
    await add(testApiClient, testNamespace, '1', 'filepath', {
      filename: 'filename',
    })
    expect(uploadFileToConfigSpy).toHaveBeenCalledWith(
      1,
      1,
      'filepath',
      'filename'
    )
  })
  it('should call ApiClient.uploadFileToConfig() without options', async () => {
    await add(testApiClient, testNamespace, '1', 'filepath', {})
    expect(uploadFileToConfigSpy).toHaveBeenCalledWith(
      1,
      1,
      'filepath',
      undefined
    )
  })
})

describe('update()', () => {
  let replaceFileInConfigSpy: any
  beforeEach(() => {
    replaceFileInConfigSpy = jest
      .spyOn(ApiClient.prototype, 'replaceFileInConfig')
      .mockReturnValue(Promise.resolve())
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should call ApiClient.replaceFileInConfig() with custom filename in options', async () => {
    await update(testApiClient, testNamespace, '1', 'filepath', {
      filename: 'filename',
    })
    expect(replaceFileInConfigSpy).toHaveBeenCalledWith(
      1,
      1,
      'filepath',
      'filename'
    )
  })
  it('should call ApiClient.replaceFileInConfig() without options', async () => {
    await update(testApiClient, testNamespace, '1', 'filepath', {})
    expect(replaceFileInConfigSpy).toHaveBeenCalledWith(
      1,
      1,
      'filepath',
      'filepath'
    )
  })
})

describe('download()', () => {
  let downloadFileDataSpy: any
  beforeEach(() => {
    downloadFileDataSpy = jest
      .spyOn(ApiClient.prototype, 'downloadFileData')
      .mockResolvedValue('')
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should call ApiClient.downloadFileData()', async () => {
    await download(testApiClient, testNamespace, '1', 'filename')
    expect(downloadFileDataSpy).toHaveBeenCalled()
  })
})

describe('deleteFiles()', () => {
  let getConfigSpy: any
  let deleteAllFilesFromConfigSpy: any
  let deleteFileFromConfigSpy: any
  let promptSpy: any
  beforeEach(() => {
    getConfigSpy = jest
      .spyOn(ApiClient.prototype, 'getConfig')
      .mockResolvedValue({
        name: 'configName',
        files: ['finlename1', 'filename2'],
      } as unknown as Config)
    deleteAllFilesFromConfigSpy = jest
      .spyOn(ApiClient.prototype, 'deleteAllFilesFromConfig')
      .mockResolvedValue()
    deleteFileFromConfigSpy = jest
      .spyOn(ApiClient.prototype, 'deleteFileFromConfig')
      .mockResolvedValue()
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should throw error when no files provided withput --all option', async () => {
    await expect(
      deleteFiles(testApiClient, testNamespace, '1', [], {})
    ).rejects.toThrow(Error('You must specify at least one filename!'))
  })
  it('should throw error when files are provided with --all option', async () => {
    await expect(
      deleteFiles(testApiClient, testNamespace, '1', ['filename1'], {
        all: true,
      })
    ).rejects.toThrow(
      Error('You cannot use --all together with a list of filenames!')
    )
  })
  it('should call ApiClient.getConfig() without --all option', async () => {
    promptSpy = jest
      .spyOn(inquirer, 'prompt')
      .mockImplementation((questions) => Promise.resolve({ continue: false }))

    await deleteFiles(testApiClient, testNamespace, '1', ['filename1'], {})

    expect(getConfigSpy).toHaveBeenCalled()
    expect(deleteAllFilesFromConfigSpy).not.toHaveBeenCalled()
    expect(deleteFileFromConfigSpy).not.toHaveBeenCalled()
    expect(promptSpy).toHaveBeenCalledTimes(1)
  })
  it('should call ApiClient.getConfig() with --all option', async () => {
    promptSpy = jest
      .spyOn(inquirer, 'prompt')
      .mockImplementation((questions) => Promise.resolve({ continue: false }))

    await deleteFiles(testApiClient, testNamespace, '1', [], {
      all: true,
    })

    expect(getConfigSpy).toHaveBeenCalled()
    expect(deleteAllFilesFromConfigSpy).not.toHaveBeenCalled()
    expect(deleteFileFromConfigSpy).not.toHaveBeenCalled()
    expect(promptSpy).toHaveBeenCalledTimes(1)
  })
  it('should call ApiClient.getConfig() and ApiClient.deleteFileFromConfig()', async () => {
    promptSpy = jest
      .spyOn(inquirer, 'prompt')
      .mockImplementation((questions) => Promise.resolve({ continue: true }))

    await deleteFiles(testApiClient, testNamespace, '1', ['filename1'], {})

    expect(getConfigSpy).toHaveBeenCalled()
    expect(deleteAllFilesFromConfigSpy).not.toHaveBeenCalled()
    expect(deleteFileFromConfigSpy).toHaveBeenCalled()
    expect(promptSpy).toHaveBeenCalledTimes(1)
  })
  it('should call ApiClient.deleteFileFromConfig() with --yes option', async () => {
    await deleteFiles(testApiClient, testNamespace, '1', ['filename1'], {
      yes: true,
    })

    expect(getConfigSpy).not.toHaveBeenCalled()
    expect(deleteAllFilesFromConfigSpy).not.toHaveBeenCalled()
    expect(deleteFileFromConfigSpy).toHaveBeenCalled()
  })
  it('should call ApiClient.getConfig() and ApiClient.deleteAllFilesFromConfig() with --all option', async () => {
    promptSpy = jest
      .spyOn(inquirer, 'prompt')
      .mockImplementation((questions) => Promise.resolve({ continue: true }))

    await deleteFiles(testApiClient, testNamespace, '1', [], { all: true })

    expect(getConfigSpy).toHaveBeenCalledTimes(2)
    expect(deleteAllFilesFromConfigSpy).toHaveBeenCalled()
    expect(deleteFileFromConfigSpy).not.toHaveBeenCalled()
    expect(promptSpy).toHaveBeenCalledTimes(1)
  })
  it('should call ApiClient.getConfig() and ApiClient.deleteAllFilesFromConfig() with --all and --yes options', async () => {
    await deleteFiles(testApiClient, testNamespace, '1', [], {
      all: true,
      yes: true,
    })

    expect(getConfigSpy).toHaveBeenCalledTimes(1)
    expect(deleteAllFilesFromConfigSpy).toHaveBeenCalled()
    expect(deleteFileFromConfigSpy).not.toHaveBeenCalled()
  })
})

describe('syncDown()', () => {
  let getConfigSpy: any
  let getFileDataSpy: any
  let writeFileSpy: any // from fs.promises
  beforeEach(() => {
    getConfigSpy = jest
      .spyOn(ApiClient.prototype, 'getConfig')
      .mockResolvedValue({
        name: 'configName',
        files: {
          qgConfig: 'http://base.url/qg-config.yaml',
          additionalConfigs: [
            'http://base.url/filename1',
            'http://base.url/filename2',
          ],
        },
      } as unknown as Config)
    getFileDataSpy = jest
      .spyOn(ApiClient.prototype, 'getFileData')
      .mockResolvedValue({
        data: new Buffer(''),
        filename: 'filename',
      })
    writeFileSpy = jest.spyOn(fs.promises, 'writeFile').mockResolvedValue()
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should not download files when user does not consent to override in prompt', async () => {
    jest.spyOn(fs, 'readdirSync').mockReturnValue([
      {
        name: 'qg-config.yaml',
        isDirectory: () => {
          return false
        },
      },
    ] as fs.Dirent[])
    jest
      .spyOn(inquirer, 'prompt')
      .mockImplementation((questions) => Promise.resolve({ overwrite: false }))

    await syncDown(testApiClient, testNamespace, '1', testDirectory, {})

    expect(getConfigSpy).toHaveBeenCalled()
    expect(getFileDataSpy).not.toHaveBeenCalled()
    expect(writeFileSpy).not.toHaveBeenCalled()
  })
  it('should download files when user consents to override in prompt', async () => {
    jest.spyOn(fs, 'readdirSync').mockReturnValue([
      {
        name: 'qg-config.yaml',
        isDirectory: () => {
          return false
        },
      },
    ] as fs.Dirent[])
    jest
      .spyOn(inquirer, 'prompt')
      .mockImplementation((questions) => Promise.resolve({ overwrite: true }))

    await syncDown(testApiClient, testNamespace, '1', testDirectory, {})

    expect(getConfigSpy).toHaveBeenCalled()
    expect(getFileDataSpy).toHaveBeenCalledTimes(3)
    expect(writeFileSpy).toHaveBeenCalledTimes(3)
  })
  it('should download files when user provides --yes option', async () => {
    jest.spyOn(fs, 'readdirSync').mockReturnValue([
      {
        name: 'qg-config.yaml',
        isDirectory: () => {
          return false
        },
      },
    ] as fs.Dirent[])

    await syncDown(testApiClient, testNamespace, '1', testDirectory, {
      yes: true,
    })

    expect(getConfigSpy).toHaveBeenCalled()
    expect(getFileDataSpy).toHaveBeenCalledTimes(3)
    expect(writeFileSpy).toHaveBeenCalledTimes(3)
  })
  it('should thow error when a directory with the same name exists', async () => {
    jest.spyOn(fs, 'readdirSync').mockReturnValue([
      {
        name: 'qg-config.yaml',
        isDirectory: () => {
          return true
        },
      },
    ] as fs.Dirent[])

    await expect(
      syncDown(testApiClient, testNamespace, '1', testDirectory, {})
    ).rejects.toThrow(
      Error(
        'Error: The target directory contains a directory with the same name as a config file. ' +
          'Please remove the directory first from the target directory before trying again.'
      )
    )

    expect(getConfigSpy).toHaveBeenCalled()
    expect(getFileDataSpy).not.toHaveBeenCalled()
    expect(writeFileSpy).not.toHaveBeenCalled()
  })
})

describe('syncUp()', () => {
  let getConfigSpy: any
  let deleteAllFilesFromConfigSpy: any
  let deleteFileFromConfigSpy: any
  let uploadFileToConfigSpy: any
  beforeEach(() => {
    getConfigSpy = jest
      .spyOn(ApiClient.prototype, 'getConfig')
      .mockResolvedValue({
        name: 'configName',
        files: {
          qgConfig: 'http://base.url/qg-config.yaml',
          additionalConfigs: [
            'http://base.url/filename1',
            'http://base.url/filename2',
          ],
        },
      } as unknown as Config)
    deleteAllFilesFromConfigSpy = jest
      .spyOn(ApiClient.prototype, 'deleteAllFilesFromConfig')
      .mockResolvedValue()
    deleteFileFromConfigSpy = jest
      .spyOn(ApiClient.prototype, 'deleteFileFromConfig')
      .mockResolvedValue()
    uploadFileToConfigSpy = jest
      .spyOn(ApiClient.prototype, 'uploadFileToConfig')
      .mockResolvedValue()
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should throw error when there are no files to upload', async () => {
    jest.spyOn(fs, 'readdirSync').mockReturnValue([] as fs.Dirent[])

    await expect(
      syncUp(testApiClient, testNamespace, '1', testDirectory, {})
    ).rejects.toThrow(
      Error(`Aborting. No files found in directory: ${testDirectory}`)
    )

    expect(deleteAllFilesFromConfigSpy).not.toHaveBeenCalled()
  })
  it('should remove all remote files when using --clean', async () => {
    jest.spyOn(fs, 'readdirSync').mockReturnValue([
      {
        name: 'qg-config.yaml',
        isFile: () => {
          return true
        },
      },
      {
        name: 'secondFile.yaml',
        isFile: () => {
          return true
        },
      },
    ] as fs.Dirent[])

    await syncUp(testApiClient, testNamespace, '1', testDirectory, {
      clean: true,
    })

    expect(deleteAllFilesFromConfigSpy).toHaveBeenCalled()
    expect(deleteFileFromConfigSpy).toHaveBeenCalledTimes(2)
    expect(uploadFileToConfigSpy).toHaveBeenCalledTimes(2)
    expect(getConfigSpy).toHaveBeenCalled()
  })
  it('should exclude by pattern and starting with .', async () => {
    jest.spyOn(fs, 'readdirSync').mockReturnValue([
      {
        name: 'qg-config.yaml',
        isFile: () => {
          return true
        },
      },
      {
        name: 'excluded.yaml',
        isFile: () => {
          return true
        },
      },
      {
        name: '.dotfile',
        isFile: () => {
          return true
        },
      },
    ] as fs.Dirent[])

    await syncUp(testApiClient, testNamespace, '1', testDirectory, {
      exclude: 'excluded',
    })

    expect(deleteAllFilesFromConfigSpy).not.toHaveBeenCalled()
    expect(deleteFileFromConfigSpy).toHaveBeenCalledTimes(1)
    expect(uploadFileToConfigSpy).toHaveBeenCalledTimes(1)
    expect(getConfigSpy).toHaveBeenCalled()
  })
})

describe('parseSyncPathParameter()', () => {
  let consoleErrorSpy: SpiedFunction
  beforeEach(() => {
    jest.spyOn(process, 'exit').mockImplementation((number) => {
      throw new Error('process.exit: ' + number)
    })
    consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation((text) => {
        return
      })
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should parse <envName>/<namespaceId>/<configId>', () => {
    const result = parseSyncPathParameter('dev/1/2', 'paramName')
    expect(result).toEqual({ envName: 'dev', namespaceId: 1, configId: '2' })
  })
  it('should parse <namespaceId>/<configId>', () => {
    const result = parseSyncPathParameter('1/2', 'paramName')
    expect(result).toEqual({ namespaceId: 1, configId: '2' })
  })
  it('should parse <configId>', () => {
    const result = parseSyncPathParameter('2', 'paramName')
    expect(result).toEqual({ configId: '2' })
  })
  it.each([
    ['env.1/1/2'],
    ['env/x/2'],
    ['env/1/y'],
    ['x/2'],
    ['1/y'],
    ['y'],
    [''],
  ])('should fail to parse "%s"', (paramValue: string) => {
    let message: any

    try {
      parseSyncPathParameter(paramValue, 'paramName')
    } catch (e) {
      if (e instanceof Error) {
        message = e.message
      }
    }

    expect(message).toBe('process.exit: 1')
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      chalk.red(
        'paramName is not valid, please use [[<envName>/]<namespaceId>/]<configId> format'
      )
    )
  })
})

describe('extractEnvironment()', () => {
  let consoleErrorSpy: SpiedFunction
  beforeEach(() => {
    jest.spyOn(process, 'exit').mockImplementation((number) => {
      throw new Error('process.exit: ' + number)
    })
    consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation((text) => {
        return
      })
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it.each([
    [true, env1.name, testNamespace, [env1, env2], env1],
    [true, env1.name, undefined, [env1, env2], env1],
    [true, undefined, undefined, [env1, env2], env1],
    [false, env2.name, testNamespace, [env1, env2], env2],
    [false, env2.name, undefined, [env1, env2], env2],
    // [false, env3.name, 999, [env1, env2, env3], env3],
  ])(
    "should an env.current=%s find by '%s' and '%s'",
    (
      current: boolean,
      envName: string | undefined,
      namespaceId: number | undefined,
      envs: Environment[],
      expected: Environment
    ) => {
      const actual: Environment = extractEnvironment(envName, namespaceId, envs)

      expect(actual).toEqual(expected)
      expect(actual.current).toEqual(current)
    }
  )
  it.each([
    [
      "Could not find environment: 'missingEnv'",
      'missingEnv',
      undefined,
      [env1, env2],
    ],
    ['Could not find current environment', undefined, undefined, []],
    [
      "Environment 'env3' does not have a namespace. Please login to select a default, or provide a custom one",
      'env3',
      undefined,
      [env1, env2, env3],
    ],
  ])(
    "should fail with '%s' for '%s' and '%s'",
    (
      errorMsg: string,
      envName: string | undefined,
      namespaceId: number | undefined,
      envs: Environment[]
    ) => {
      let message: any

      try {
        extractEnvironment(envName, namespaceId, envs)
      } catch (e) {
        if (e instanceof Error) {
          message = e.message
        }
      }

      expect(message).toBe('process.exit: 1')
      expect(consoleErrorSpy).toHaveBeenCalledWith(chalk.red(errorMsg))
    }
  )
  it('should not modify the source environments list in the process', () => {
    const originalSrcEnvs = [env1, env2]
    const clonedSrcEnvs = structuredClone(originalSrcEnvs)
    const result1: Environment = extractEnvironment(
      undefined,
      77,
      originalSrcEnvs
    )
    const result2: Environment = extractEnvironment(
      undefined,
      99,
      originalSrcEnvs
    )

    expect(result1.namespace).toBe(77)
    expect(result2.namespace).toBe(99)
    expect(originalSrcEnvs).toEqual(clonedSrcEnvs)
  })
})

describe('extractSecretsList()', () => {
  let consoleWarnSpy: SpiedFunction
  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation((text) => {
      return
    })
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('shold return all the secrets from qg-config.yaml', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true)
    jest
      .spyOn(fs, 'readFileSync')
      .mockReturnValue(
        '${{secrets.SECRET_1}} ${{ secrets.SECRET_2 }}\n${{  secrets.SECRET_3  }}\n${{   secrets.SECRET_1}}'
      )
    const expectedSecrets = ['SECRET_1', 'SECRET_2', 'SECRET_3']

    const actualSecrets = extractSecretsList(testDirectory)

    expect(actualSecrets).toEqual(expectedSecrets)
    expect(consoleWarnSpy).not.toHaveBeenCalled()
  })
  it('shold warn about missing qg-config.yaml', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false)

    const actualSecrets = extractSecretsList(testDirectory)

    expect(actualSecrets).toEqual([])
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      chalk.yellow('Source config does not contain qg-config.yaml file')
    )
  })
})

describe('listMissingSecrets()', () => {
  let consoleWarnSpy: SpiedFunction
  let listAllSecretsSpy: any
  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation((text) => {
      return
    })
    jest.spyOn(fs, 'existsSync').mockReturnValue(true)
    listAllSecretsSpy = jest
      .spyOn(ApiClient.prototype, 'listAllSecrets')
      .mockResolvedValue([{ name: 'SECRET_2' }] as SecretMetadata[])
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should list all secrets', async () => {
    jest
      .spyOn(fs, 'readFileSync')
      .mockReturnValue(
        '${{ secrets.SECRET_1 }} ${{ secrets.SECRET_2 }} ${{ secrets.SECRET_3 }}'
      )

    await listMissingSecrets(testApiClient, testNamespace, testDirectory)

    expect(listAllSecretsSpy).toHaveBeenCalled()
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      chalk.yellow('The following secrets are missing in the destination:')
    )
    expect(consoleWarnSpy).toHaveBeenCalledWith(chalk.yellow(`\t- SECRET_1`))
    expect(consoleWarnSpy).toHaveBeenCalledWith(chalk.yellow(`\t- SECRET_3`))
  })
  it('should not list secrets when qg-config.yaml is secrets free', async () => {
    jest.spyOn(fs, 'readFileSync').mockReturnValue('')

    await listMissingSecrets(testApiClient, testNamespace, testDirectory)

    expect(listAllSecretsSpy).not.toHaveBeenCalled()
    expect(consoleWarnSpy).not.toHaveBeenCalled()
  })
  it('should not list secrets when all of them exists in destination as well', async () => {
    jest.spyOn(fs, 'readFileSync').mockReturnValue('${{ secrets.SECRET_2 }}')

    await listMissingSecrets(testApiClient, testNamespace, testDirectory)

    expect(listAllSecretsSpy).toHaveBeenCalled()
    expect(consoleWarnSpy).not.toHaveBeenCalled()
  })
})

describe('cleanupSyncFiles()', () => {
  it('should call rmSync', () => {
    const rmSyncSpy = jest.spyOn(fs, 'rmSync').mockReturnValue()

    cleanupSyncFiles(testDirectory)

    expect(rmSyncSpy).toHaveBeenCalledWith(testDirectory, {
      recursive: true,
      force: true,
    })

    rmSyncSpy.mockRestore()
  })
})

describe('sync()', () => {
  const originalEnv = process.env
  const originalReadFileSync = fs.readFileSync
  let rmSyncSpy: any
  let mkdirSyncSpy: any
  let getConfigSpy: any
  let getFileDataSpy: any
  let writeFileSpy: any
  let deleteFileFromConfigSpy: any
  let uploadFileToConfigSpy: any
  let listAllSecretsSpy: any
  let consoleWarnSpy: any
  beforeEach(() => {
    jest.resetModules()
    process.env = {
      ...originalEnv,
      HOME: testEnvHome,
      RUNTIME_CONFIG: undefined,
    }
    jest.spyOn(fs, 'existsSync').mockReturnValue(true)
    jest
      .spyOn(fs, 'readFileSync')
      .mockImplementation(
        (
          path: fs.PathOrFileDescriptor,
          options?:
            | (fs.ObjectEncodingOptions & { flag?: string | undefined })
            | BufferEncoding
            | null
            | undefined
        ) => {
          if (path.toString().indexOf('qg-config.yaml') > -1) {
            return '${{secrets.SECRET_1}}'
          } else if (path.toString().indexOf('.yakurc') > -1) {
            return JSON.stringify([env3], undefined, 2)
          } else {
            return originalReadFileSync(path, options)
          }
        }
      )
    jest.spyOn(fs, 'readdirSync').mockReturnValue([
      {
        name: 'qg-config.yaml',
        isFile: () => {
          return true
        },
        isDirectory: () => {
          return false
        },
      },
    ] as fs.Dirent[])
    getConfigSpy = jest
      .spyOn(ApiClient.prototype, 'getConfig')
      .mockResolvedValue({
        name: 'configName',
        files: {
          qgConfig: 'http://base.url/qg-config.yaml',
          additionalConfigs: [
            'http://base.url/filename1',
            'http://base.url/filename2',
          ],
        },
      } as unknown as Config)
    getFileDataSpy = jest
      .spyOn(ApiClient.prototype, 'getFileData')
      .mockResolvedValue({
        data: new Buffer(''),
        filename: 'qg-config.yaml',
      })
    writeFileSpy = jest.spyOn(fs.promises, 'writeFile').mockResolvedValue()
    rmSyncSpy = jest.spyOn(fs, 'rmSync').mockReturnValue()
    mkdirSyncSpy = jest.spyOn(fs, 'mkdirSync').mockReturnValue(undefined)
    deleteFileFromConfigSpy = jest
      .spyOn(ApiClient.prototype, 'deleteFileFromConfig')
      .mockResolvedValue()
    uploadFileToConfigSpy = jest
      .spyOn(ApiClient.prototype, 'uploadFileToConfig')
      .mockResolvedValue()
    listAllSecretsSpy = jest
      .spyOn(ApiClient.prototype, 'listAllSecrets')
      .mockResolvedValue([] as SecretMetadata[])
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation((text) => {
      return
    })
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should sync the files between namespaces and present missing secrets', async () => {
    await sync('env3/1/2', 'env3/3/4', {})

    expect(rmSyncSpy).toHaveBeenCalled()
    expect(mkdirSyncSpy).toHaveBeenCalled()
    expect(getConfigSpy).toHaveBeenCalled()
    expect(getFileDataSpy).toHaveBeenCalled()
    expect(writeFileSpy).toHaveBeenCalled()
    expect(deleteFileFromConfigSpy).toHaveBeenCalled()
    expect(uploadFileToConfigSpy).toHaveBeenCalled()
    expect(listAllSecretsSpy).toHaveBeenCalled()
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      chalk.yellow('The following secrets are missing in the destination:')
    )
    expect(consoleWarnSpy).toHaveBeenCalledWith(chalk.yellow(`\t- SECRET_1`))
  })
  it('should sync the files between namespaces and skip secrets check', async () => {
    await sync('env3/1/2', 'env3/3/4', { skipSecrets: true })

    expect(rmSyncSpy).toHaveBeenCalled()
    expect(mkdirSyncSpy).toHaveBeenCalled()
    expect(getConfigSpy).toHaveBeenCalled()
    expect(getFileDataSpy).toHaveBeenCalled()
    expect(writeFileSpy).toHaveBeenCalled()
    expect(deleteFileFromConfigSpy).toHaveBeenCalled()
    expect(uploadFileToConfigSpy).toHaveBeenCalled()
    expect(listAllSecretsSpy).not.toHaveBeenCalled()
    expect(consoleWarnSpy).not.toHaveBeenCalledWith()
  })
})
