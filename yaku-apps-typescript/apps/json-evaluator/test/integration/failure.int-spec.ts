import { describe, it, expect, beforeAll } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import { run, RunProcessResult } from '../../../../integration-tests/src/util'

describe('Fail', async () => {
  const jsonEvaluatorExecutable: string = path.join(
    __dirname,
    '..',
    '..',
    'dist',
    'index.js',
  )

  const testFileLocationPrefix = `${__dirname}/../samples/`

  const testCases: {
    case: string
    env: {
      JSON_INPUT_FILE: string
      JSON_CONFIG_FILE: string
    }
    expectedOutput: string
    exitCode: number
  }[] = [
    {
      case: 'non-existing config file',
      env: {
        JSON_INPUT_FILE: 'bitbucket_data.json',
        JSON_CONFIG_FILE: 'non-existant-config-file.yaml',
      },
      expectedOutput: `{"status":"FAILED","reason":"File test/samples/non-existant-config-file.yaml does not exist, no data can be evaluated"}`,
      exitCode: 0,
    },
    {
      case: 'non-existing json file',
      env: {
        JSON_INPUT_FILE: 'non-existant-input-file.json',
        JSON_CONFIG_FILE: 'bitbucket.yaml',
      },
      expectedOutput: `{"status":"FAILED","reason":"File test/samples/non-existant-input-file.json does not exist, no data can be evaluated"}`,
      exitCode: 0,
    },
    {
      case: 'bad config file',
      env: {
        JSON_INPUT_FILE: 'bitbucket_data.json',
        JSON_CONFIG_FILE: 'bad_config.yaml',
      },
      expectedOutput: `{"status":"FAILED","reason":"Code: unrecognized_keys ~ Path: checks[0] ~ Message: Unrecognized key(s) in object: 'bad_property'"}`,
      exitCode: 0,
    },
    {
      case: 'bad JSON file',
      env: {
        JSON_INPUT_FILE: 'bad_JSON_data.json',
        JSON_CONFIG_FILE: 'bitbucket.yaml',
      },
      expectedOutput: `Error: File test/samples/bad_JSON_data.json could not be parsed, failed with error: SyntaxError: Expected ',' or '}' after property value in JSON`,
      exitCode: 1,
    },
  ]

  beforeAll(() => {
    expect(fs.existsSync(jsonEvaluatorExecutable)).to.equal(true)
  })

  it.each(testCases)('%s', async (testCase) => {
    const result: RunProcessResult = await run(jsonEvaluatorExecutable, [], {
      env: {
        JSON_INPUT_FILE: `${testFileLocationPrefix}${testCase.env.JSON_INPUT_FILE}`,
        JSON_CONFIG_FILE: `${testFileLocationPrefix}${testCase.env.JSON_CONFIG_FILE}`,
      },
    })

    expect(result.exitCode).toEqual(testCase.exitCode)

    if (testCase.exitCode) {
      expect(result.stderr.length).toBeGreaterThan(0)
      expect(result.stderr[0]).toContain(testCase.expectedOutput)
    } else {
      expect(result.stdout.length).toBeGreaterThan(0)
      expect(result.stdout).toContain(testCase.expectedOutput)
    }
  })
})
