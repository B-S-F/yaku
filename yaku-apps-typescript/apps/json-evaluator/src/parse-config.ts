// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { readFile } from 'fs/promises'
import YAML from 'yaml'
import { AppError } from '@B-S-F/autopilot-utils'
import { generateErrorMessage } from 'zod-error'

import { Check, Config, ConfigSchema, variableRegex } from './types'
import { isValidCheckIndex } from './util'

export const readYamlData = async (
  filePath: string
): Promise<{ checks: Check[] }> => {
  try {
    const data = await readFile(filePath, 'utf-8')
    return YAML.parse(data)
  } catch (error) {
    throw new AppError(
      `File ${filePath} could not be read, failed with error: ${error}`
    )
  }
}

export const parseConfig = async (filepath: string) => {
  const config = await readYamlData(filepath)
  const parsedSchema = ConfigSchema.safeParse(config)

  if (!parsedSchema.success) {
    for (const { code, path } of parsedSchema.error.issues) {
      const invalidNameString =
        code === 'invalid_string' && path[2] && path[2] === 'name'

      if (invalidNameString && isValidCheckIndex(path[1])) {
        // On an invalid string, the path result for checks is [ 'checks', <check-nr>, 'name' ]
        const checkIndex = path[1]

        // This helps remove bad emphasises in markdown
        const checkNameWithUnderscores = config.checks[checkIndex].name.replace(
          /_/g,
          '\\_'
        )

        const msg = `check _${checkNameWithUnderscores}_ contains not-allowed characters, allowed characters are alphanumeric and underscores (\\_). [Regexp](https://regex101.com/) used to validate check names: _${variableRegex}_`
        throw new AppError(msg)
      }
    }

    const msg = generateErrorMessage(parsedSchema.error.issues)
    throw new AppError(msg)
  }
  return parsedSchema.data as Config
}
