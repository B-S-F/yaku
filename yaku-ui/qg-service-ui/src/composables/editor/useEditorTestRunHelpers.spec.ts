// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { useEditorTestRunHelpers } from './useEditorTestRunHelpers'

describe('useEditorTestRunHelpers', () => {
  const { _extractToken, _consumeTokens } = useEditorTestRunHelpers()
  describe('_consumeTokens', () => {
    const tests: {
      label: string
      input: [number, string][]
      output: ReturnType<typeof _consumeTokens>
    }[] = [
      {
        label: 'the first check',
        input: [
          [0, 'chapters'],
          [2, '0'],
          [4, 'requirements'],
          [6, '1 - Scope'],
          [10, 'Scope'],
          [10, 'General Comments'],
          [8, 'checks'],
          [10, '1.1'],
          [12, 'automation'],
        ],
        output: { chapter: '0', requirement: '1 - Scope', check: '1.1' },
      },
      {
        label: 'the second check',
        input: [
          [0, 'chapters'],
          [2, '0'],
          [4, 'requirements'],
          [6, '1 - Scope'],
          [10, 'Scope'],
          [10, 'General Comments'],
          [8, 'checks'],
          [10, '1.1'],
          [12, 'manual'],
          [10, '1.2'],
          [12, 'automation'],
          [14, 'autopilot'],
        ],
        output: { chapter: '0', requirement: '1 - Scope', check: '1.2' },
      },
      {
        label: 'the first check of the second requirements',
        input: [
          [0, 'chapters'],
          [2, '0'],
          [4, 'requirements'],
          [6, '1 - Scope'],
          [10, 'Scope'],
          [10, 'General Comments'],
          [8, 'checks'],
          [10, '1.1'],
          [12, 'manual'],
          [10, '1.2'],
          [12, 'automation'],
          [14, 'env'],
          [6, '2 - Overall Assessment Result'],
          [
            10,
            'The findings are listed here and can also be found on our [MVP Board]',
          ],
          [10, 'Startup Technical Responsible'],
          [10, 'Startup Product Owner'],
          [10, 'GROW/QMM'],
          [10, 'GROW/ENG'],
          [10, 'GROW/GM in case of "R'],
          [10, 'Legal Entity Representative'],
          [8, 'checks'],
          [10, '1'],
          [12, 'automation'],
        ],
        output: {
          chapter: '0',
          requirement: '2 - Overall Assessment Result',
          check: '1',
        },
      },
      {
        label: 'the first check of the second chapter',
        input: [
          [0, 'chapters'],
          [2, '0'],
          [4, 'requirements'],
          [6, '1 - Scope'],
          [10, 'Scope'],
          [10, 'General Comments'],
          [8, 'checks'],
          [10, '1.1'],
          [12, 'manual'],
          [10, '1.2'],
          [12, 'automation'],
          [14, 'env'],
          [6, '2 - Overall Assessment Result'],
          [
            10,
            'The findings are listed here and can also be found on our [MVP Board]',
          ],
          [10, 'Startup Technical Responsible'],
          [10, 'Startup Product Owner'],
          [10, 'GROW/QMM'],
          [10, 'GROW/ENG'],
          [10, 'GROW/GM in case of "R'],
          [10, 'Legal Entity Representative'],
          [8, 'checks'],
          [10, '1'],
          [12, 'manual'],
          [10, '2'],
          [12, 'automation'],
          [14, 'env'],
          [2, '1'],
          [4, 'requirements'],
          [6, 'PM-01'],
          [8, 'checks'],
          [10, '1.1'],
          [12, 'automation'],
          [14, 'env'],
        ],
        output: {
          chapter: '1',
          requirement: 'PM-01',
          check: '1.1',
        },
      },
      {
        label: 'no tokens provided - assuming we are outside of chapters',
        input: [],
        output: undefined,
      },
      {
        label: 'the selection is outside of a check with indentation matching',
        input: [
          [0, 'chapters'],
          [2, '0'],
          [4, 'requirements'],
          [6, '1 - Scope'],
          [10, 'Scope'],
          [10, 'General Comments'],
        ],
        output: undefined,
      },
      {
        label: 'the selection is outside of the chapters block',
        input: [
          [0, 'metadata'],
          [2, 'version'],
          [0, 'header'],
        ],
        output: undefined,
      },
    ]

    tests.map((t) => {
      it(t.label, () => {
        expect(_consumeTokens(t.input)).toStrictEqual(t.output)
      })
    })
  })

  describe('_extractToken', () => {
    ;[
      { in: '', out: undefined },
      { in: 'chapters:', out: [0, 'chapters'] },
      { in: '  chapters:', out: [2, 'chapters'] },
      { in: '  chapters', out: undefined },
      { in: '    "1 out of scope":', out: [4, '1 out of scope'] },
    ].map((test) => {
      it(`"${test.in}" -> [${test.out?.join(',')}]`, () =>
        expect(_extractToken(test.in)).toStrictEqual(test.out))
    })
  })
})
