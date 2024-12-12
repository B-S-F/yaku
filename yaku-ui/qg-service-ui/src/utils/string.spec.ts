// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { slugify, levenshtein } from './string'

describe('slugify', () => {
  const tests = [
    {
      input: 'Some -- random -- Character',
      output: 'some-random-character',
    },
  ]

  tests.map((test) => {
    it(`slugs "${test.input}"`, () => {
      expect(slugify(test.input)).toStrictEqual(test.output)
    })
  })
})

describe('levenstein', () => {
  const tests: { input: Parameters<typeof levenshtein>; output: number }[] = [
    {
      input: ['a', 'a'],
      output: 0,
    },
    {
      input: ['mend-autopilot-vulnerabilities', 'mend-autopilot-alerts'],
      output: 10,
    },
    {
      input: ['azure-devops-autopilot', 'mend-autopilot-vulnerabilities'],
      output: 23,
    },
  ]

  tests.map((test) => {
    it(`levenstein("${test.input[0]}", "${test.input[1]}") --> ${test.output}`, () => {
      expect(levenshtein(test.input[0], test.input[1])).toStrictEqual(
        test.output,
      )
    })
  })
})
