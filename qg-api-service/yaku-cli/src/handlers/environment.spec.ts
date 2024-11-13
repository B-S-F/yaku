import { jest } from '@jest/globals'
import {
  Environment,
  Environments,
  loadEnvironments,
  createEnvironment,
  getCurrentEnvironment,
  updateEnvironment,
  loadCurrentEnvironment,
  updateEnvironmentByKey,
  selectEnvironment,
  deleteEnvironment,
  getEnvironmentsFilePath,
  saveEnvironments,
  showEnvironmentsTable,
  editEnvironments,
  getSelectedEnvironmentIdx,
} from './environment'
import chalk from 'chalk'
import { SpiedFunction } from 'jest-mock'
import fs, { PathOrFileDescriptor } from 'fs'
import yp from '../yaku-prompts.js'

// in order to set expectations
const testEnvHome = '/tmp'
const testEnvFilePath = testEnvHome + '/.yakurc'

describe('loadEnvironments()', () => {
  const originalEnv = process.env
  let consoleWarnSpy: SpiedFunction
  let consoleErrorSpy: SpiedFunction
  let writeFileSyncSpy: SpiedFunction

  beforeEach(() => {
    jest.resetModules()
    process.env = {
      ...originalEnv,
      HOME: testEnvHome,
      RUNTIME_CONFIG: undefined,
    }
    // the corner cases actually end the program, so we need to be able to assess them
    jest.spyOn(process, 'exit').mockImplementation((number) => {
      throw new Error('process.exit: ' + number)
    })
    writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync')
    consoleWarnSpy = jest.spyOn(console, 'warn')
    consoleErrorSpy = jest.spyOn(console, 'error')
  })

  afterEach(() => {
    process.env = originalEnv
    jest.restoreAllMocks()
  })

  it('should warn, return empty list, and create the file without .yakurc file present', () => {
    const existsSyncSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(false)

    const envs: Environments = loadEnvironments()

    // the warning message must be specific to automatic creation
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      chalk.yellow(
        `Creating the initial environment configuration file '${testEnvFilePath}'..`
      )
    )
    expect(envs.length).toBe(0)
    expect(existsSyncSpy).toHaveBeenCalledWith(testEnvFilePath)
    expect(writeFileSyncSpy).toHaveBeenCalled()
  })

  it('should return empty list with empty .yakurc file', () => {
    const existsSyncSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(true)
    const readFileSyncSpy = jest.spyOn(fs, 'readFileSync').mockReturnValue('[]')

    const envs: Environments = loadEnvironments()
    expect(envs.length).toBe(0)
    expect(existsSyncSpy).toHaveBeenCalledWith(testEnvFilePath)
    expect(readFileSyncSpy).toHaveBeenCalled()
    expect(writeFileSyncSpy).not.toHaveBeenCalled()
  })

  it('should fail to read .yakurc when permissions are missing', () => {
    const existsSyncSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(true)
    const readFileSyncSpy = jest
      .spyOn(fs, 'readFileSync')
      .mockImplementation((path: PathOrFileDescriptor) => {
        throw new Error(`EACCES: permission denied, open '${testEnvFilePath}'`)
      })
    let message: any
    try {
      loadEnvironments()
    } catch (e) {
      // make sure the error comes from our mocked process.exit(1)
      if (e instanceof Error) {
        message = e.message
      }
    }
    expect(message).toBe('process.exit: 1')

    // the error message must be specific to permissions
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      chalk.red(
        `Failed to access '${testEnvFilePath}': Error: EACCES: permission denied, open '${testEnvFilePath}'`
      )
    )
    expect(existsSyncSpy).toHaveBeenCalledWith(testEnvFilePath)
    expect(readFileSyncSpy).toHaveBeenCalled()
    expect(writeFileSyncSpy).not.toHaveBeenCalled()
  })

  it('should fail to read .yakurc with incorrect content', () => {
    const existsSyncSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(true)
    const readFileSyncSpy = jest
      .spyOn(fs, 'readFileSync')
      .mockReturnValue('![]')
    let message: any
    try {
      loadEnvironments()
    } catch (e) {
      // make sure the error comes from our mocked process.exit(1)
      if (e instanceof Error) {
        message = e.message
      }
    }
    expect(message).toBe('process.exit: 1')

    // the error message must be specific to permissions
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      chalk.red(
        `Failed to parse '${testEnvFilePath}' as JSON: SyntaxError: Unexpected token ! in JSON at position 0`
      )
    )
    expect(existsSyncSpy).toHaveBeenCalledWith(testEnvFilePath)
    expect(readFileSyncSpy).toHaveBeenCalled()
    expect(writeFileSyncSpy).not.toHaveBeenCalled()
  })
})

describe('createEnvironment()', () => {
  const originalEnv = process.env
  let writeFileSyncSpy: SpiedFunction

  beforeEach(() => {
    jest.resetModules()
    process.env = {
      ...originalEnv,
      HOME: testEnvHome,
      RUNTIME_CONFIG: undefined,
    }
    jest.spyOn(fs, 'existsSync').mockReturnValue(true)
    writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync')
  })

  afterEach(() => {
    process.env = originalEnv
    jest.restoreAllMocks()
  })

  it('should create a new environment in an empty .yakurc file', () => {
    const newEnv: Environment = {
      name: 'new',
      url: 'http://dot.com/api/v1',
      accessToken: 'acc',
      refreshToken: 'ref',
      expiresAt: 1719927052,
      namespace: 1,
      current: true,
    }
    const readFileSyncSpy = jest.spyOn(fs, 'readFileSync').mockReturnValue('[]')

    createEnvironment(newEnv)

    expect(readFileSyncSpy).toHaveBeenCalled()
    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      testEnvFilePath,
      JSON.stringify([newEnv], undefined, 2),
      {
        mode: 0o600,
      }
    )
  })

  it('should replace an existing environment with the same name in .yakurc file', () => {
    const newEnv: Environment = {
      name: 'new',
      url: 'http://dot.com/api/v1',
      accessToken: 'acc',
      refreshToken: 'ref',
      expiresAt: 1719927052,
      namespace: 1,
      current: true,
    }
    const readFileSyncSpy = jest
      .spyOn(fs, 'readFileSync')
      .mockReturnValue(JSON.stringify([newEnv], undefined, 2))

    createEnvironment(newEnv)

    expect(readFileSyncSpy).toHaveBeenCalled()
    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      testEnvFilePath,
      JSON.stringify([newEnv], undefined, 2),
      {
        mode: 0o600,
      }
    )
  })

  it('should create a new environment in a non-empty .yakurc file', () => {
    const existingEnv: Environment = {
      name: 'existing',
      url: 'http://dot.com/api/v1',
      accessToken: 'acc',
      refreshToken: 'ref',
      expiresAt: 1719927052,
      namespace: 1,
      current: true,
    }
    const newEnv: Environment = {
      name: 'new',
      url: 'http://dot.com/api/v1',
      accessToken: 'acc',
      refreshToken: 'ref',
      expiresAt: 1719927052,
      namespace: 1,
      current: true,
    }
    const readFileSyncSpy = jest
      .spyOn(fs, 'readFileSync')
      .mockReturnValue(JSON.stringify([existingEnv], undefined, 2))

    createEnvironment(newEnv)

    expect(readFileSyncSpy).toHaveBeenCalled()
    existingEnv.current = false // changes with the addition of the new env
    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      testEnvFilePath,
      JSON.stringify([existingEnv, newEnv], undefined, 2),
      {
        mode: 0o600,
      }
    )
  })
})

describe('updateEnvironment()', () => {
  const originalEnv = process.env
  let consoleSpy: SpiedFunction
  let writeFileSyncSpy: SpiedFunction

  beforeEach(() => {
    jest.resetModules()
    process.env = {
      ...originalEnv,
      HOME: testEnvHome,
      RUNTIME_CONFIG: undefined,
    }
    jest.spyOn(fs, 'existsSync').mockReturnValue(true)
    writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync')
    consoleSpy = jest.spyOn(console, 'error')
  })

  afterEach(() => {
    process.env = originalEnv
    jest.restoreAllMocks()
  })

  it('should fail to update non-existent environment in .yakurc', () => {
    const toUpdate: Environment = {
      name: 'dummy',
      url: 'http://dot.com/api/v1',
      accessToken: 'acc',
      refreshToken: 'ref',
      expiresAt: 1719927052,
      namespace: 1,
      current: true,
    }
    const readFileSyncSpy = jest.spyOn(fs, 'readFileSync').mockReturnValue('[]')

    updateEnvironment('dummy', toUpdate)

    // the error message must be specific to update
    expect(consoleSpy).toHaveBeenCalledWith(
      chalk.red(`Environment '${toUpdate.name}' not found!`)
    )

    expect(readFileSyncSpy).toHaveBeenCalled()
    expect(writeFileSyncSpy).not.toHaveBeenCalled()
  })

  it('should update an existing environment in .yakurc', () => {
    const existingEnv: Environment = {
      name: 'existing',
      url: 'http://dot.com/api/v1',
      accessToken: 'acc',
      refreshToken: 'ref',
      expiresAt: 1719927052,
      namespace: 1,
      current: true,
    }

    const toUpdate: Environment = {
      name: 'existing',
      url: 'http://dot1.com/api/v1',
      accessToken: 'acc1',
      refreshToken: 'ref1',
      expiresAt: 1719927053,
      namespace: 2,
      current: true,
    }

    const readFileSyncSpy = jest
      .spyOn(fs, 'readFileSync')
      .mockReturnValue(JSON.stringify([existingEnv], undefined, 2))

    updateEnvironment('existing', toUpdate)

    expect(readFileSyncSpy).toHaveBeenCalled()
    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      testEnvFilePath,
      JSON.stringify([toUpdate], undefined, 2),
      {
        mode: 0o600,
      }
    )
  })
})

describe('loadCurrentEnvironment()', () => {
  const originalEnv = process.env
  let existsSyncSpy: SpiedFunction<(path: fs.PathLike) => boolean>

  beforeEach(() => {
    jest.resetModules()
    process.env = {
      ...originalEnv,
      HOME: testEnvHome,
      RUNTIME_CONFIG: undefined,
    }
    existsSyncSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(true)
  })

  afterEach(() => {
    process.env = originalEnv
    jest.restoreAllMocks()
  })

  it('should load existing current environment from .yakurc', () => {
    const existing: Environment = {
      name: 'dummy',
      url: 'http://dot.com/api/v1',
      accessToken: 'acc',
      refreshToken: 'ref',
      expiresAt: 1719927052,
      namespace: 1,
      current: true,
    }
    const readFileSyncSpy = jest
      .spyOn(fs, 'readFileSync')
      .mockReturnValue(JSON.stringify([existing], undefined, 2))

    const env: Environment = loadCurrentEnvironment()

    expect(env.name).toBe(existing.name)
    expect(existsSyncSpy).toHaveBeenCalledWith(testEnvFilePath)
    expect(readFileSyncSpy).toHaveBeenCalled()
  })

  it('should fail to load current environment from an empty .yakurc', () => {
    const readFileSyncSpy = jest.spyOn(fs, 'readFileSync').mockReturnValue('[]')
    let message: any
    try {
      loadCurrentEnvironment()
    } catch (e) {
      // make sure the error comes from our mocked process.exit(1)
      if (e instanceof Error) {
        message = e.message
      }
    }

    expect(message).toBe(
      'No current environment found. Please login with "yaku login" or switch to an existing environment with "yaku environments switch <envName>"'
    )
    expect(existsSyncSpy).toHaveBeenCalledWith(testEnvFilePath)
    expect(readFileSyncSpy).toHaveBeenCalled()
  })

  it('should fail to load an incomplete current environment from .yakurc', () => {
    const existing: Environment = {
      name: 'dummy',
      url: '',
      accessToken: undefined,
      refreshToken: 'ref',
      expiresAt: 1719927052,
      namespace: 1,
      current: true,
    }
    const readFileSyncSpy = jest
      .spyOn(fs, 'readFileSync')
      .mockReturnValue(JSON.stringify([existing], undefined, 2))

    let message: any
    try {
      loadCurrentEnvironment()
    } catch (e) {
      // make sure the error comes from our mocked process.exit(1)
      if (e instanceof Error) {
        message = e.message
      }
    }
    expect(message).toBe(
      `Environment '${existing.name}' is incomplete. Please login again with "yaku login ${existing.name} or create a new environment with "yaku environments create"`
    )
    expect(existsSyncSpy).toHaveBeenCalledWith(testEnvFilePath)
    expect(readFileSyncSpy).toHaveBeenCalled()
  })
})

describe('updateEnvironmentByKey()', () => {
  const originalEnv = process.env
  let consoleSpy: SpiedFunction
  let existsSyncSpy: SpiedFunction<(path: fs.PathLike) => boolean>
  let writeFileSyncSpy: SpiedFunction
  let readFileSyncSpy: SpiedFunction<{
    (
      path: fs.PathOrFileDescriptor,
      options?:
        | { encoding?: null | undefined; flag?: string | undefined }
        | null
        | undefined
    ): Buffer
    (
      path: fs.PathOrFileDescriptor,
      options:
        | BufferEncoding
        | { encoding: BufferEncoding; flag?: string | undefined }
    ): string
    (
      path: fs.PathOrFileDescriptor,
      options?:
        | BufferEncoding
        | (fs.ObjectEncodingOptions & { flag?: string | undefined })
        | null
        | undefined
    ): string | Buffer
  }>
  let existing: Environment

  beforeEach(() => {
    jest.resetModules()
    process.env = {
      ...originalEnv,
      HOME: testEnvHome,
      RUNTIME_CONFIG: undefined,
    }
    existsSyncSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(true)
    writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync')
    consoleSpy = jest.spyOn(console, 'error')

    existing = {
      name: 'dummy',
      url: 'http://dot.com/api/v1',
      accessToken: 'acc',
      refreshToken: 'ref',
      expiresAt: 1719927052,
      namespace: 1,
      current: true,
    }

    readFileSyncSpy = jest
      .spyOn(fs, 'readFileSync')
      .mockReturnValue(JSON.stringify([existing], undefined, 2))
  })

  afterEach(() => {
    process.env = originalEnv
    jest.restoreAllMocks()
  })

  it('should not update with non-existing key', () => {
    updateEnvironmentByKey(existing.name, 'expiresAt', '1')

    // the error message must be specific to update
    expect(consoleSpy).toHaveBeenCalledWith(
      chalk.red(
        `Invalid key 'expiresAt'. Key must be either 'name', 'url', 'token', or 'namespace'.`
      )
    )

    expect(existsSyncSpy).not.toHaveBeenCalled()
    expect(readFileSyncSpy).not.toHaveBeenCalled()
  })

  it('should not update with non-existing environment', () => {
    updateEnvironmentByKey('dummy2', 'name', 'dummy1')

    // the error message must be specific to update
    expect(consoleSpy).toHaveBeenCalledWith(
      chalk.red(`Environment 'dummy2' not found!`)
    )

    expect(existsSyncSpy).toHaveBeenCalled()
    expect(readFileSyncSpy).toHaveBeenCalled()
    expect(writeFileSyncSpy).not.toHaveBeenCalled()
  })

  it('should update name field', () => {
    const newName = 'dummy2'

    updateEnvironmentByKey(existing.name, 'name', 'dummy2')
    existing.name = newName
    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      testEnvFilePath,
      JSON.stringify([existing], undefined, 2),
      {
        mode: 0o600,
      }
    )
  })

  it('should update the url field', () => {
    updateEnvironmentByKey(existing.name, 'url', 'http://dot2.com/api/v1')

    existing.url = 'http://dot2.com/api/v1'
    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      testEnvFilePath,
      JSON.stringify([existing], undefined, 2),
      {
        mode: 0o600,
      }
    )
  })

  it('should update the token field', () => {
    updateEnvironmentByKey(existing.name, 'token', 'acc2')

    existing.accessToken = 'acc2'
    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      testEnvFilePath,
      JSON.stringify([existing], undefined, 2),
      {
        mode: 0o600,
      }
    )
  })

  it('should update the namespace field', () => {
    updateEnvironmentByKey(existing.name, 'namespace', '2')

    existing.namespace = 2
    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      testEnvFilePath,
      JSON.stringify([existing], undefined, 2),
      {
        mode: 0o600,
      }
    )
  })

  it('should alter and update the url with /api/v1 with prompt confirmation', async () => {
    // this mock takes control of the yaku prompt
    const fun = jest.spyOn(yp, 'confirm').mockResolvedValue(true)

    await updateEnvironmentByKey(existing.name, 'url', 'http://dot2.com')

    existing.url = 'http://dot2.com/api/v1'
    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      testEnvFilePath,
      JSON.stringify([existing], undefined, 2),
      {
        mode: 0o600,
      }
    )

    fun.mockReset()
  })

  it('should update the url as is without prompt confirmation', async () => {
    // this mock takes control of the yaku prompt
    const fun = jest.spyOn(yp, 'confirm').mockResolvedValue(false)

    await updateEnvironmentByKey(existing.name, 'url', 'http://dot2.com')

    existing.url = 'http://dot2.com'
    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      testEnvFilePath,
      JSON.stringify([existing], undefined, 2),
      {
        mode: 0o600,
      }
    )

    fun.mockReset()
  })
})

describe('selectEnvironment()', () => {
  const envs: Environments = [
    {
      name: 'dummy',
      url: 'http://dot.com/api/v1',
      accessToken: 'acc',
      refreshToken: 'ref',
      expiresAt: 1719927052,
      namespace: 1,
      current: false,
    },
    {
      name: 'dummy2',
      url: 'http://dot2.com/api/v1',
      accessToken: 'acc2',
      refreshToken: 'ref2',
      expiresAt: 1719927052,
      namespace: 2,
      current: true,
    },
  ]

  afterEach(() => {
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })

  it('should select the non-current environment from the list', async () => {
    // this mock takes control of the yaku prompt
    jest.spyOn(yp, 'search').mockResolvedValue('dummy')

    const selected = await selectEnvironment(envs)

    expect(selected).toBe('dummy')
  })

  it('should select the current environment from the list', async () => {
    // this mock takes control of the yaku prompt
    jest.spyOn(yp, 'search').mockResolvedValue('dummy2')

    const selected = await selectEnvironment(envs)

    expect(selected).toBe('dummy2')
    expect(getCurrentEnvironment(envs).name).toBe('dummy2')
  })

  it('should fail to select from an empty list', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation((msg) => {
        return
      })
    jest.spyOn(process, 'exit').mockImplementation((number) => {
      throw new Error('process.exit: ' + number)
    })

    await expect(selectEnvironment([])).rejects.toThrow(
      Error('process.exit: 1')
    )

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      chalk.red('No environments available')
    )
  })
})

describe('deleteEnvironment()', () => {
  const originalEnv = process.env
  let consoleErrorSpy: any
  let consoleLogSpy: any
  let existing: Environment

  beforeEach(() => {
    jest.resetModules()
    process.env = {
      ...originalEnv,
      HOME: testEnvHome,
      RUNTIME_CONFIG: undefined,
    }
    existing = {
      name: 'dummy',
      url: 'http://dot.com/api/v1',
      accessToken: 'acc',
      refreshToken: 'ref',
      expiresAt: 1719927052,
      namespace: 1,
      current: true,
    }
    jest.spyOn(fs, 'existsSync').mockReturnValue(true)
    jest.spyOn(fs, 'writeFileSync')
    jest
      .spyOn(fs, 'readFileSync')
      .mockReturnValue(JSON.stringify([existing], undefined, 2))
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((msg) => {
      return
    })
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation((msg) => {
      return
    })
  })

  afterEach(() => {
    process.env = originalEnv
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })

  it('should delete the provied envronment', async () => {
    await deleteEnvironment('dummy', true)

    expect(consoleErrorSpy).not.toHaveBeenCalled()
    expect(consoleLogSpy).not.toHaveBeenCalled()
  })
  it('should delete the selected envronment', async () => {
    // this mock takes control of the yaku prompt
    jest.spyOn(yp, 'search').mockResolvedValue('dummy')

    await deleteEnvironment('')

    expect(consoleErrorSpy).not.toHaveBeenCalled()
    expect(consoleLogSpy).toHaveBeenCalledWith(
      `The current environment was changed from '${existing.name}' to 'default'.`
    )
    expect(consoleLogSpy).toHaveBeenCalledWith(
      `Environment '${existing.name}' was deleted.`
    )
  })
  it('should not delete the default envronment', async () => {
    await deleteEnvironment('default')

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      chalk.red('The default environment cannot be deleted.')
    )
  })
  it('should not delete the envronment that cannot be found', async () => {
    const missingEnvName = 'dummy2'
    // this mock takes control of the yaku prompt
    jest.spyOn(yp, 'search').mockResolvedValue(missingEnvName)

    await deleteEnvironment('')

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      chalk.red(`Environment '${missingEnvName}' not found!`)
    )
  })
})

describe('getEnvironmentsFilePath()', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
  })
  afterEach(() => {
    process.env = originalEnv
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })
  it('should return the environment file path from $HOME/.yakurc', () => {
    process.env = {
      ...originalEnv,
      HOME: testEnvHome,
      RUNTIME_CONFIG: undefined,
    }
    expect(getEnvironmentsFilePath()).toBe(`${testEnvHome}/.yakurc`)
  })
  it('should return the environment file path from $HOME/$RUNTIME_CONFIG', () => {
    process.env = {
      ...originalEnv,
      HOME: testEnvHome,
      RUNTIME_CONFIG: '.rtconfig',
    }
    expect(getEnvironmentsFilePath()).toBe(`${testEnvHome}/.rtconfig`)
  })
  it('should not return the environment file path', () => {
    process.env = {
      ...originalEnv,
      HOME: undefined,
      RUNTIME_CONFIG: undefined,
    }
    expect(() => {
      getEnvironmentsFilePath()
    }).toThrow(
      Error(
        '$HOME is not set, cannot find the environment definitions, please ensure the variable to point to your users home folder'
      )
    )
  })
})

describe('saveEnvironments()', () => {
  const originalEnv = process.env
  afterEach(() => {
    process.env = originalEnv
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })

  it('should delete the provied envronment', () => {
    process.env = {
      ...originalEnv,
      HOME: testEnvHome,
      RUNTIME_CONFIG: undefined,
    }
    const writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync')
    saveEnvironments([])

    expect(writeFileSyncSpy).toHaveBeenCalled()
  })
})

describe('showEnvironmentsTable()', () => {
  const originalEnv = process.env
  let writeFileSyncSpy: any
  let consoleErrorSpy: any
  let consoleWarnSpy: any
  let existing: Environment
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      HOME: testEnvHome,
      RUNTIME_CONFIG: undefined,
    }
    existing = {
      name: 'dummy',
      url: 'http://dot.com/api/v1',
      accessToken: 'acc',
      refreshToken: 'ref',
      expiresAt: 1719927052,
      namespace: 1,
      current: true,
    }
    writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync')
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((msg) => {
      return
    })
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation((msg) => {
      return
    })
    jest.spyOn(process, 'exit').mockImplementation((number) => {
      throw new Error('process.exit: ' + number)
    })
  })
  afterEach(() => {
    process.env = originalEnv
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })

  it('should save the changes in the table', async () => {
    // this mock takes control of the yaku prompt
    jest
      .spyOn(yp, 'createTablePrompt')
      .mockResolvedValue([
        [
          existing.current,
          existing.name,
          existing.url,
          String(existing.namespace),
        ],
      ])

    await showEnvironmentsTable([existing])

    expect(writeFileSyncSpy).toHaveBeenCalled()
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      chalk.yellow('Environments updated successfully')
    )
  })
  it('should not save the changes in the table', async () => {
    // this mock takes control of the yaku prompt
    jest.spyOn(yp, 'createTablePrompt').mockResolvedValue(undefined)

    await showEnvironmentsTable([existing])

    expect(writeFileSyncSpy).not.toHaveBeenCalled()
    expect(consoleWarnSpy).not.toHaveBeenCalled()
  })
  it('should fail to present an empty table', async () => {
    await expect(showEnvironmentsTable([])).rejects.toThrow(
      Error('process.exit: 1')
    )

    expect(writeFileSyncSpy).not.toHaveBeenCalled()
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      chalk.red('No environments available')
    )
  })
})

describe('editEnvironments()', () => {
  const originalEnv = process.env
  let spawnSpy: any
  let consoleLogSpy: any
  beforeEach(() => {
    spawnSpy = jest.spyOn(yp, 'openFileInEditor').mockResolvedValue()
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation((msg) => {
      return
    })
  })
  afterEach(() => {
    process.env = originalEnv
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })
  it('should open file in env configured editor', async () => {
    process.env = {
      ...originalEnv,
      HOME: testEnvHome,
      RUNTIME_CONFIG: undefined,
      EDITOR: 'dummy',
    }

    await editEnvironments()

    expect(consoleLogSpy).toHaveBeenCalledWith(
      `Opening '${testEnvHome}/.yakurc' in ${process.env.EDITOR} external editor..`
    )
    expect(spawnSpy).toHaveBeenCalledWith(
      `${testEnvHome}/.yakurc`,
      process.env.EDITOR
    )
  })
  it('should open file in default editor', async () => {
    process.env = {
      ...originalEnv,
      HOME: testEnvHome,
      RUNTIME_CONFIG: undefined,
      EDITOR: undefined,
    }

    await editEnvironments()

    expect(consoleLogSpy).toHaveBeenCalledWith(
      `$EDITOR environment variable is not set, opening '${testEnvHome}/.yakurc' in default external editor..`
    )
    expect(spawnSpy).toHaveBeenCalledWith(`${testEnvHome}/.yakurc`, undefined)
  })
})

describe('getSelectedEnvironmentIdx()', () => {
  it('should find the index of the selected environment', () => {
    const result = getSelectedEnvironmentIdx([
      [false, 'name1'],
      [true, 'name2'],
      [false, 'name3'],
    ])
    expect(result).toBe(1)
  })
  it('should return undefined when no env is selected', () => {
    const result = getSelectedEnvironmentIdx([
      [false, 'name1'],
      [false, 'name2'],
      [false, 'name3'],
    ])
    expect(result).toBe(undefined)
  })
})
