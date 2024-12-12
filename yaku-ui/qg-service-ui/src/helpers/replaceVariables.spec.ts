// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { replaceVariables, replaceAllVariables } from './replaceVariables'

describe('replaceVariables', () => {
  const text = 'replace ${{ env.TITLE }}'

  it('replaces envs', () => {
    const envs = {
      TITLE: 'title',
    }
    expect(replaceVariables(text, envs, 'env')).toBe('replace title')
  })

  it('returns the same text if there are no vars set', () => {
    expect(replaceVariables(text, {}, 'env')).toBe(text)
  })
})

describe('replaceAllVariables', () => {
  const text = 'replace ${{ env.TITLE }} ${{ vars.TEXT }}'
  it('replaces envs and vars', () => {
    const vars = {
      env: {
        TITLE: 'title',
      },
      vars: {
        TEXT: 'text',
      },
    }
    expect(replaceAllVariables(text, vars)).toBe('replace title text')
  })

  it('returns the same text if there are no vars set', () => {
    expect(replaceAllVariables(text, { env: {}, vars: {} })).toBe(text)
  })
})
