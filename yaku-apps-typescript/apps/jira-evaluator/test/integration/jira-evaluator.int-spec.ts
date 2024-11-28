// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import * as fs from 'fs'
import * as path from 'path'
import { beforeAll, describe, expect, it } from 'vitest'
import { run, RunProcessResult } from '../../../../integration-tests/src/util'

type TestCase = {
  name: string
  dataName: string
  configName: string
  expectExitCode: number
  expectedStatus: string
  expectedReason: string
  expectedCriterionAmount: number
}

const testCases: TestCase[] = [
  {
    name: 'green-path',
    dataName: 'data.json',
    configName: 'green-path-config.yaml',
    expectExitCode: 0,
    expectedStatus: 'GREEN',
    expectedReason: 'All issues are valid',
    expectedCriterionAmount: 1,
  },
  {
    name: 'non-existing-issues-file',
    dataName: 'non-existing-issues-data.json',
    configName: 'green-path-config.yaml',
    expectExitCode: 0,
    expectedStatus: 'FAILED',
    expectedReason:
      'File test/integration/fixtures/non-existing-issues-data.json does not exist, no data can be evaluated',
    expectedCriterionAmount: 0,
  },
  {
    name: 'one-illegal-field',
    dataName: 'data.json',
    configName: 'one-illegal-field-config.yaml',
    expectExitCode: 0,
    expectedStatus: 'RED',
    expectedReason: 'Some issues are invalid',
    expectedCriterionAmount: 2,
  },
  {
    name: 'illegal-fields-with-and-logic',
    dataName: 'data.json',
    configName: 'illegal-fields-with-and-logic-config.yaml',
    expectExitCode: 0,
    expectedStatus: 'RED',
    expectedReason: 'Some issues are invalid',
    expectedCriterionAmount: 2,
  },
]

function retrieveStatus(outputLines: string[]): string {
  const statusLine = outputLines.find((line) => line.includes('{"status":'))
  if (statusLine) {
    const status = JSON.parse(statusLine).status
    return status
  }
  return ''
}

function retrieveReason(outputLines: string[]): string {
  const reasonLine = outputLines.find((line) => line.includes('reason'))
  if (reasonLine) {
    const reason = JSON.parse(reasonLine).reason
    return reason
  }
  return ''
}

function retrieveCriterionAmount(outputLines: string[]): number {
  const criterionLines = outputLines.filter((line) =>
    line.includes('criterion'),
  )
  return criterionLines.length
}

describe('Jira evaluator', () => {
  const jiraEvaluatorExecutable: string = path.join(
    __dirname,
    '..',
    '..',
    'dist',
    'index.js',
  )

  beforeAll(() => {
    expect(fs.existsSync(jiraEvaluatorExecutable)).to.equal(true)
  })

  it.each(testCases)('%s', async (testCase: TestCase) => {
    const jiraEnvironment = {
      JIRA_CONFIG_FILE_PATH: path.join(
        __dirname,
        'fixtures',
        testCase.configName,
      ),
      JIRA_ISSUES_JSON_NAME: path.join(
        __dirname,
        'fixtures',
        testCase.dataName,
      ),
    }
    const result: RunProcessResult = await run(jiraEvaluatorExecutable, [], {
      env: jiraEnvironment,
    })

    expect(result.exitCode).toEqual(testCase.expectExitCode)
    expect(result.stdout.length).toBeGreaterThan(0)
    expect(retrieveStatus(result.stdout)).toEqual(testCase.expectedStatus)
    expect(retrieveReason(result.stdout)).toEqual(testCase.expectedReason)
    expect(retrieveCriterionAmount(result.stdout)).toEqual(
      testCase.expectedCriterionAmount,
    )
  })
})
