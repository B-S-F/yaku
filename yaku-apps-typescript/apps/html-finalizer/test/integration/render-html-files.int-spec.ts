// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { readFile } from 'fs/promises'
import path from 'path'
import { describe, expect, it } from 'vitest'
import { renderHtmlFiles } from '../../src/index'

const resultPaths = [
  'test/integration/input/v1',
  'test/integration/input/v1-with-logs',
]

describe('renderHtmlFiles', () => {
  it.each(resultPaths)(
    'should render result %p',
    async (resultPath: string) => {
      process.env['result_path'] = resultPath
      const files = [
        'qg-dashboard.html',
        'qg-full-report.html',
        'qg-result.html',
        'qg-evidence.html',
      ]
      for (const file of files) {
        await renderHtmlFiles([file])
        const html = await readFile(path.join(resultPath, file), {
          encoding: 'utf8',
        })
        const strippedHtml: string[] = []
        html.split('\n').forEach((line) => {
          strippedHtml.push(line.trim())
        })
        expect(strippedHtml.join('\n')).toMatchSnapshot()
      }
    },
  )
})
