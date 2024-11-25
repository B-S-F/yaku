// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import ejs, { Data } from 'ejs'
import resolve from './resolve.js'
import markdown from '@B-S-F/markdown-utils'
import { outputFile } from 'fs-extra'
import path from 'path'
export interface OutputFile {
  /** Name of the template file */
  template: string
  /** Name of the output file to generate */
  output: string
  /** Defines if the file is default output or not */
  default?: boolean
  /** Additional data to pass to the ejs renderer */
  additionalConfig?: Data
}

/**
 * Escapes characters for XML and converts quotes to typography quotes
 * @param mdText Markdown formatted text
 */
function escape(mdText: any) {
  return ejs.escapeXML(markdown.smartquotes(mdText))
}

export default function FileRenderer(data: Data, resultPath: string) {
  return async ({ template, output, additionalConfig }: OutputFile) => {
    const mergedData = additionalConfig
      ? { ...data, ...additionalConfig }
      : data
    const html = await ejs.renderFile(
      resolve(import.meta.url, template),
      mergedData,
      {
        escape,
      },
    )
    await outputFile(path.join(resultPath, output), html)
    if (!(additionalConfig && additionalConfig.silent))
      console.info(`${output} generated successfully.`)
  }
}
