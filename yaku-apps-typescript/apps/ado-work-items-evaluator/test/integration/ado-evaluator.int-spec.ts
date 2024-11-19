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
    name: 'full-config',
    dataName: 'full-config.json',
    configName: 'full-config.yaml',
    expectExitCode: 0,
    expectedStatus: 'GREEN',
    expectedReason: 'All work items are valid',
    expectedCriterionAmount: 1,
  },
  {
    name: 'missing-config',
    dataName: 'data_missing.json',
    configName: 'full-config.yaml',
    expectExitCode: 0,
    expectedStatus: 'FAILED',
    expectedReason:
      'File test/integration/fixtures/data_missing.json does not exist, no data can be evaluated',
    expectedCriterionAmount: 0,
  },
  {
    name: 'evaluate-assignees-of-workitems-33-34',
    dataName: 'config-evaluate-assignees-of-workitems-33-34.json',
    configName: 'config-evaluate-assignees-of-workitems-33-34.yaml',
    expectExitCode: 0,
    expectedStatus: 'RED',
    expectedReason: 'Some work items are invalid',
    expectedCriterionAmount: 1,
  },
  {
    name: 'evaluate-assignees-of-workitems-34',
    dataName: 'config-evaluate-assignees-of-workitems-34.json',
    configName: 'config-evaluate-assignees-of-workitems-34.yaml',
    expectExitCode: 0,
    expectedStatus: 'GREEN',
    expectedReason: 'All work items are valid',
    expectedCriterionAmount: 0,
  },
]

function retrieveStatus(outputLines: string[]): string {
  const statusLine = outputLines.find((line) => line.includes('status'))
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

describe('Ado Fetcher', () => {
  const adoEvaluatorExecutable: string = path.join(
    __dirname,
    '..',
    '..',
    'dist',
    'index.js',
  )

  beforeAll(() => {
    expect(fs.existsSync(adoEvaluatorExecutable)).to.be.true
  })

  it.each(testCases)('%s', async (testCase: TestCase) => {
    const adoEnvironment = {
      ADO_CONFIG_FILE_PATH: path.join(
        __dirname,
        'fixtures',
        testCase.configName,
      ),
      ADO_WORK_ITEMS_JSON_NAME: path.join(
        __dirname,
        'fixtures',
        testCase.dataName,
      ),
    }
    const result: RunProcessResult = await run(adoEvaluatorExecutable, [], {
      env: adoEnvironment,
    })

    console.log(result.stdout[0])
    expect(result.exitCode).toEqual(testCase.expectExitCode)
    expect(result.stdout.length).toBeGreaterThan(0)
    expect(retrieveStatus(result.stdout)).toEqual(testCase.expectedStatus)
    expect(retrieveReason(result.stdout)).toEqual(testCase.expectedReason)
    expect(retrieveCriterionAmount(result.stdout)).toEqual(
      testCase.expectedCriterionAmount,
    )
  })
})
