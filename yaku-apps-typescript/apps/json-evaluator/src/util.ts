// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { AppError } from '@B-S-F/autopilot-utils'

import fs from 'fs'
import path from 'path'

export function getPathFromEnvVariable(envVariableName: string): string {
  const filePath: string | undefined = process.env[envVariableName] || ''
  const relativePath = path.relative(process.cwd(), filePath.trim())
  validateFilePath(relativePath)
  return relativePath
}

export function validateFilePath(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    throw new AppError(
      `File ${filePath} does not exist, no data can be evaluated`,
    )
  }
  try {
    fs.accessSync(filePath, fs.constants.R_OK)
  } catch (e) {
    throw new AppError(`${filePath} is not readable!`)
  }
  if (!fs.statSync(filePath).isFile()) {
    throw new AppError(`${filePath} does not point to a file!`)
  }
}

export function isValidCheckIndex(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value)
}
