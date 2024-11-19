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
        '**HAS CATEGORY CHECK:**_category_ _store book_ is including _fiction_',
      fulfilled: true,
      metadata: { status: 'GREEN' },
      justification: 'Field content satisfy condition',
    },
  },
  {
    result: {
      criterion:
        '**CATEGORY CHECK:**_category_ _store book_ is equal to _fiction reference_',
      fulfilled: false,
      metadata: { status: 'RED' },
      justification:
        'Actual values equal: "**"reference", "fiction", "fiction", "fiction"**"',
    },
  },
  {
    result: {
      criterion:
        '**FICTION CHECK:**all _category_ _store book_ are equal to _fiction_',
      fulfilled: false,
      metadata: { status: 'RED' },
      justification:
        'One or more values do not satisfy the condition: "**"reference", Sayings of the Century**"',
    },
  },
  {
    result: {
      criterion:
        '**NONE FANTASY CHECK:**none _category_ _store book_ are equal to _fantasy_',
      fulfilled: true,
      metadata: { status: 'GREEN' },
      justification: 'Field content satisfy condition',
    },
  },
  {
    result: {
      criterion:
        '**CONCATENATION CONDITION:** has_category_check && category_check && fiction_check && none_fantasy_check',
      justification: 'Evaluation result is "RED" with this condition',
      fulfilled: false,
    },
  },
]

describe('test_array_data.json', async () => {
  const jsonEvaluatorExecutable: string = path.join(
    __dirname,
    '..',
    '..',
    'dist',
    'index.js'
  )

  beforeAll(() => {
    expect(fs.existsSync(jsonEvaluatorExecutable)).to.be.true
  })

  it('can be evaluated properly', async () => {
    const env = {
      JSON_INPUT_FILE: `${__dirname}/../samples/test_array_data.json`,
      JSON_CONFIG_FILE: `${__dirname}/../samples/test_array.yaml`,
      CONTINUE_SEARCH_ON_FAIL: 'false',
    }

    const result: RunProcessResult = await run(jsonEvaluatorExecutable, [], {
      env,
    })
    const results = result.stdout.reduce(
      (count, str) => count + (str.includes('result') ? 1 : 0),
      0
    )

    for (const issue of baseIssues) {
      expect(result.stdout).toContain(JSON.stringify(issue))
    }
    expect(results).toEqual(5)
    expect(result.stderr).to.be.empty
  })
})
