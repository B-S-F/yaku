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
  createEnvsSubcommands,
} from './environment'
import chalk from 'chalk'
import inquirer from 'inquirer'
import { Command } from 'commander'
import { SpiedFunction } from 'jest-mock'
import fs, { PathOrFileDescriptor } from 'fs'

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

  it('should alter and update the url with /api/v1 with prompt confirmation', () => {
    // this mock takes control of the inquirer prompt
    const fun = jest
      .spyOn(inquirer, 'prompt')
      .mockImplementation((questions) => Promise.resolve({ updateUrl: true }))

    updateEnvironmentByKey(existing.name, 'url', 'http://dot2.com').then(() => {
      existing.url = 'http://dot2.com/api/v1'
      expect(writeFileSyncSpy).toHaveBeenCalledWith(
        testEnvFilePath,
        JSON.stringify([existing], undefined, 2),
        {
          mode: 0o600,
        }
      )
    })
    fun.mockReset()
  })

  it('should update the url as is without prompt confirmation', () => {
    // this mock takes control of the inquirer prompt
    const fun = jest
      .spyOn(inquirer, 'prompt')
      .mockImplementation((questions) => Promise.resolve({ updateUrl: false }))

    updateEnvironmentByKey(existing.name, 'url', 'http://dot2.com').then(() => {
      existing.url = 'http://dot2.com'
      expect(writeFileSyncSpy).toHaveBeenCalledWith(
        testEnvFilePath,
        JSON.stringify([existing], undefined, 2),
        {
          mode: 0o600,
        }
      )
    })
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
  })

  it('should select the non-current environment from the list', () => {
    // this mock takes control of the inquirer prompt
    const fun = jest
      .spyOn(inquirer, 'prompt')
      .mockImplementation((questions) => Promise.resolve({ envName: 'dummy' }))

    selectEnvironment(envs).then((selected) => {
      expect(selected).toBe('dummy')
    })
    fun.mockReset()
  })

  it('should select the current environment from the list', () => {
    // this mock takes control of the inquirer prompt
    const fun = jest
      .spyOn(inquirer, 'prompt')
      .mockImplementation((questions) =>
        Promise.resolve({ envName: 'dummy2 [current]' })
      )

    selectEnvironment(envs).then((selected) => {
      expect(selected).toBe('dummy2')
      expect(getCurrentEnvironment(envs).name).toBe('dummy2')
    })
    fun.mockReset()
  })
})

describe('createEnvsSubcommands', () => {
  it('should use the Command library to create the env-specific commands', () => {
    const program = new Command()
    const commandSpy = jest.spyOn(Command.prototype, 'command')

    const envs = program
      .command('environments')
      .alias('envs')
      .description('Manage environments')
      .showHelpAfterError()

    createEnvsSubcommands(envs)

    expect(commandSpy).toHaveBeenCalledWith('update')
    expect(commandSpy).toHaveBeenCalledWith('list')
    expect(commandSpy).toHaveBeenCalledWith('edit')
    expect(commandSpy).toHaveBeenCalledWith('switch [envName]')
    expect(commandSpy).toHaveBeenCalledWith('create')
    expect(commandSpy).toHaveBeenCalledWith('delete')
    commandSpy.mockReset()
  })
})
