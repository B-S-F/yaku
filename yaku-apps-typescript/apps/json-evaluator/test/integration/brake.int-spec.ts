// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { describe, it, expect, beforeAll } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import { run, RunProcessResult } from '../../../../integration-tests/src/util'

const baseIssues = [
  {
    status: 'RED',
    reason: 'Some fields do not have valid values',
  },
  {
    result: {
      criterion:
        '**NOT REVIEWED CHECK:**all _Not reviewed_ _results_ are equal to _0_',
      fulfilled: false,
      metadata: { status: 'RED' },
      justification:
        'One or more values do not satisfy the condition: "**"52", 2022-07-05T00:00:00.000+02:00**"',
    },
  },
  {
    result: {
      criterion:
        '**PARTLY COMPLETED CHECK:**all _Reviews partly completed_ _results_ are equal to _0_',
      fulfilled: false,
      metadata: { status: 'YELLOW' },
      justification:
        'One or more values do not satisfy the condition: "**"29", 2022-07-05T00:00:00.000+02:00**"',
    },
  },
  {
    result: {
      criterion:
        '**CONCATENATION CONDITION:** not_reviewed_check && partly_completed_check',
      justification: 'Evaluation result is "RED" with this condition',
      fulfilled: false,
    },
  },
]
const extenedIssues = [
  {
    result: {
      criterion:
        '**NOT REVIEWED CHECK:**all _Not reviewed_ _results_ are equal to _0_',
      fulfilled: false,
      metadata: { status: 'RED' },
      justification:
        'One or more values do not satisfy the condition: "**"72", 2022-10-25T00:00:00.000+02:00**"',
    },
  },
  {
    result: {
      criterion:
        '**PARTLY COMPLETED CHECK:**all _Reviews partly completed_ _results_ are equal to _0_',
      fulfilled: false,
      metadata: { status: 'YELLOW' },
      justification:
        'One or more values do not satisfy the condition: "**"60", 2022-12-11T00:00:00.000+01:00**"',
    },
  },
]

describe('brake.json', async () => {
  const jsonEvaluatorExecutable: string = path.join(
    __dirname,
    '..',
    '..',
    'dist',
    'index.js',
  )

  beforeAll(() => {
    expect(fs.existsSync(jsonEvaluatorExecutable)).to.be.true
  })

  it('can be evaluated properly while checking for ONE breaking element', async () => {
    const env = {
      JSON_INPUT_FILE: `${__dirname}/../samples/brake_data.json`,
      JSON_CONFIG_FILE: `${__dirname}/../samples/brake.yaml`,
      CONTINUE_SEARCH_ON_FAIL: 'false',
    }

    const result: RunProcessResult = await run(jsonEvaluatorExecutable, [], {
      env,
    })
    const results = result.stdout.reduce(
      (count, str) => count + (str.includes('result') ? 1 : 0),
      0,
    )

    for (const issue of baseIssues) {
      expect(result.stdout).toContain(JSON.stringify(issue))
    }
    expect(results).toEqual(3)
    expect(result.stderr).to.be.empty
  })

  it('can be evaluated properly while checking for ALL breaking elements', async () => {
    const env = {
      JSON_INPUT_FILE: `${__dirname}/../samples/brake_data.json`,
      JSON_CONFIG_FILE: `${__dirname}/../samples/brake.yaml`,
      CONTINUE_SEARCH_ON_FAIL: 'true',
    }

    const result: RunProcessResult = await run(jsonEvaluatorExecutable, [], {
      env,
    })
    const results = result.stdout.reduce(
      (count, str) => count + (str.includes('result') ? 1 : 0),
      0,
    )

    for (const issue of baseIssues) {
      expect(result.stdout).toContain(JSON.stringify(issue))
    }
    for (const issue of extenedIssues) {
      expect(result.stdout).toContain(JSON.stringify(issue))
    }
    expect(results).toEqual(317)
    expect(result.stderr).to.be.empty
  })
})
