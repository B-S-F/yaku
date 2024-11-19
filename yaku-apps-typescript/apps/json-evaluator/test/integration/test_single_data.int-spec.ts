// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { describe, it, expect, beforeAll } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import { run, RunProcessResult } from '../../../../integration-tests/src/util'

const baseIssues = [
  {
    status: 'YELLOW',
    reason: 'Some fields do not have valid values',
  },
  {
    result: {
      criterion:
        '**HAS GOOD COVERAGE:**_totals percent covered_ is greater than or equal to _80_',
      fulfilled: false,
      metadata: { status: 'YELLOW' },
      justification: 'Actual values equal: "**[70.6989247311828]**"',
    },
  },
]

describe('test_single_data.json', async () => {
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

  it('can be evaluated properly', async () => {
    const env = {
      JSON_INPUT_FILE: `${__dirname}/../samples/test_single_data.json`,
      JSON_CONFIG_FILE: `${__dirname}/../samples/test_single.yaml`,
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
    expect(results).toEqual(1)
    expect(result.stderr).to.be.empty
  })
})
