import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest'
import * as autopilotUtils from '@B-S-F/autopilot-utils'
import { checkEnvironmentVariables, main } from '../../src/main'
import * as parseConfig from '../../src/parse-config'
import * as utils from '../../src/util'
import { Config } from '../../src/types'
import * as evaluate from '../../src/evaluate'

vi.mock('../src/evaluate', () => ({
  evaluate: vi.fn(),
}))

vi.mock('../src/logger', () => {
  const Logger = vi.fn()
  Logger.prototype.getLogString = vi.fn(() => 'some log string')
  Logger.prototype.end = vi.fn()
  Logger.prototype.restore = vi.fn()
  return { Logger }
})

describe('checkEnvironmentVariables', () => {
  beforeEach(() => {
    vi.stubEnv('JSON_INPUT_FILE', 'somefile')
    vi.stubEnv('JSON_CONFIG_FILE', 'someotherfile')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should throw an error if env variable "JSON_INPUT_FILE" is not provided', () => {
    vi.stubEnv('JSON_INPUT_FILE', '')
    expect(() => checkEnvironmentVariables()).toThrowError(
      'Env variable "JSON_INPUT_FILE" is not provided',
    )
  })

  it('should throw an error if env variable "JSON_CONFIG_FILE" is not provided', () => {
    vi.stubEnv('JSON_CONFIG_FILE', '')
    expect(() => checkEnvironmentVariables()).toThrowError(
      'Env variable "JSON_CONFIG_FILE" is not provided',
    )
  })
})

describe('main', () => {
  process.exit = vi.fn()
  vi.mock('fs')

  beforeEach(() => {
    vi.stubEnv('JSON_INPUT_FILE', 'somefile')
    vi.stubEnv('JSON_CONFIG_FILE', 'test.json')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should set status to FAILED when JSON_INPUT_FILE environment variable was not set', async () => {
    delete process.env.JSON_INPUT_FILE
    const spyStatus = vi.spyOn(autopilotUtils.AppOutput.prototype, 'setStatus')
    const spyReason = vi.spyOn(autopilotUtils.AppOutput.prototype, 'setReason')

    await main()

    expect(spyStatus).toHaveBeenCalledWith('FAILED')
    expect(spyReason).toHaveBeenCalledWith(
      'Env variable "JSON_INPUT_FILE" is not provided',
    )
  })

  it('should set status to FAILED when JSON_CONFIG_FILE environment variable was not set', async () => {
    delete process.env.JSON_CONFIG_FILE
    const spyStatus = vi.spyOn(autopilotUtils.AppOutput.prototype, 'setStatus')
    const spyReason = vi.spyOn(autopilotUtils.AppOutput.prototype, 'setReason')

    await main()

    expect(spyStatus).toHaveBeenCalledWith('FAILED')
    expect(spyReason).toHaveBeenCalledWith(
      'Env variable "JSON_CONFIG_FILE" is not provided',
    )
  })

  it('should throw an error when the config parsing failed', async () => {
    const spyGetPathFromEnvVariable = vi.spyOn(utils, 'getPathFromEnvVariable')
    spyGetPathFromEnvVariable.mockImplementation(() => {
      throw new Error('Unexpected error')
    })

    const result = main()

    await expect(result).rejects.toThrowError(new Error('Unexpected error'))
  })

  it('should throw an error when the config parsing failed', async () => {
    const expectedConfig = {
      checks: [
        {
          name: 'Check1',
          ref: '$.prop1',
          condition: '$.prop1 === 1',
          true: 'GREEN',
        },
        {
          name: 'Check2',
          ref: '$.prop2',
          condition: '$.prop2 === "foo"',
          false: 'YELLOW',
        },
      ],
      concatenation: {
        condition: 'Check1 && Check2',
      },
    }

    const spyGetPathFromEnvVariable = vi.spyOn(utils, 'getPathFromEnvVariable')
    spyGetPathFromEnvVariable.mockReturnValue('test.json')

    const spyParseConfig = vi.spyOn(parseConfig, 'parseConfig')
    spyParseConfig.mockResolvedValue(expectedConfig as unknown as Config)

    const spyEvaluate = vi.spyOn(evaluate, 'evaluate')
    spyEvaluate.mockImplementation(() => {
      throw new Error('Unexpected error')
    })

    const result = main()

    await expect(result).rejects.toThrowError(new Error('Unexpected error'))
  })
})
