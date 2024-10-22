import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  getPathFromEnvVariable,
  isValidCheckIndex,
  validateFilePath,
} from '../../src/util'
import fs from 'fs'
import { AppError } from '@B-S-F/autopilot-utils'

describe('getPathFromEnvVariable', () => {
  vi.mock('fs')

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('should return the path for an environment variable which is not empty', () => {
    vi.stubEnv('JSON_CONFIG_FILE', 'test.json')

    const envVariableName = 'JSON_CONFIG_FILE'
    const filePath = 'test.json'

    const spyExistsSync = vi.spyOn(fs, 'existsSync')
    spyExistsSync.mockImplementation(() => true)

    const spyAccessSync = vi.spyOn(fs, 'accessSync')
    spyAccessSync.mockImplementation(() => true)

    const spyStatSync = vi.spyOn(fs, 'statSync')
    spyStatSync.mockImplementation(
      vi.fn().mockImplementation(() => ({ isFile: () => true })),
    )

    process.env[envVariableName] = filePath

    const result = getPathFromEnvVariable(envVariableName)
    expect(result).toBe(filePath)
  })

  it('should return the path for an environment variable which is empty', () => {
    vi.stubEnv('JSON_CONFIG_FILE', '')

    const envVariableName = 'JSON_CONFIG_FILE'
    const filePath = ''

    const spyExistsSync = vi.spyOn(fs, 'existsSync')
    spyExistsSync.mockImplementation(() => true)

    const spyAccessSync = vi.spyOn(fs, 'accessSync')
    spyAccessSync.mockImplementation(() => true)

    const spyStatSync = vi.spyOn(fs, 'statSync')
    spyStatSync.mockImplementation(
      vi.fn().mockImplementation(() => ({ isFile: () => true })),
    )

    process.env[envVariableName] = filePath

    const result = getPathFromEnvVariable(envVariableName)
    expect(result).toBe(filePath)
  })
})

describe('validateFilePath', () => {
  vi.mock('fs')

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('should throw an error when the file path does not exist', () => {
    const filePath = 'test.yaml'
    const errorMessage = `File ${filePath} does not exist, no data can be evaluated`

    const spyExistsSync = vi.spyOn(fs, 'existsSync')
    spyExistsSync.mockImplementation(() => false)

    expect(() => validateFilePath(filePath)).toThrowError(
      new AppError(errorMessage),
    )
  })

  it('should throw an error when the file path is not readable', () => {
    const filePath = 'test.yaml'
    const errorMessage = `${filePath} is not readable!`

    const spyExistsSync = vi.spyOn(fs, 'existsSync')
    spyExistsSync.mockImplementation(() => true)

    const spyAccessSync = vi.spyOn(fs, 'accessSync')
    spyAccessSync.mockImplementation(() => {
      throw new AppError(errorMessage)
    })
    expect(() => validateFilePath(filePath)).toThrowError(
      new AppError(errorMessage),
    )
  })

  it('should throw an error when the file path does not point to a file', () => {
    const filePath = 'test.yaml'
    const errorMessage = `${filePath} does not point to a file!`

    const spyExistsSync = vi.spyOn(fs, 'existsSync')
    spyExistsSync.mockImplementation(() => true)

    const spyAccessSync = vi.spyOn(fs, 'accessSync')
    spyAccessSync.mockImplementation(() => true)

    const spyStatSync = vi.spyOn(fs, 'statSync')
    spyStatSync.mockImplementation(
      vi.fn().mockImplementation(() => ({ isFile: () => false })),
    )

    expect(() => validateFilePath(filePath)).toThrowError(errorMessage)
  })
})

describe('isValidCheckIndex', () => {
  it('should return true if the value is an integer number', () => {
    const index = 1
    const result = isValidCheckIndex(index)
    expect(result).toBe(true)
  })

  it('should return false if the value is not a number', () => {
    const index = 'string'
    const result = isValidCheckIndex(index)
    expect(result).toBe(false)
  })

  it('should return false if the value is a number, but not integer', () => {
    const index = 1.2
    const result = isValidCheckIndex(index)
    expect(result).toBe(false)
  })
})
