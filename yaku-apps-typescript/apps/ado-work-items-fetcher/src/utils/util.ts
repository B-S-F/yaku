// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import fs from 'fs'
import { EnvironmentError } from './custom-errors.js'

export function getEnvVariable(envVariableName: string): string {
  const envVariable: string | undefined = process.env[envVariableName]
  if (envVariable === undefined || envVariable.trim() === '') {
    throw new EnvironmentError(
      `The environment variable "${envVariableName}" is not set!`
    )
  }
  return envVariable.trim()
}

export function getPath(envVariableName: string): string {
  const path: string = getEnvVariable(envVariableName)
  if (!fs.existsSync(path)) {
    throw new Error(`${envVariableName} points to non-existing path ${path}`)
  }
  return path
}
