import { AppError } from '@B-S-F/autopilot-utils'
import fs from 'fs'
import path from 'path'
export function getPathFromEnvVariable(
  envVariableName: string,
  alt?: string
): string {
  const filePath: string | undefined = process.env[envVariableName] ?? alt
  if (filePath === undefined || filePath.trim() === '') {
    throw new AppError(
      `The environment variable "${envVariableName}" is not set!`
    )
  }
  const relativePath = path.relative(process.cwd(), filePath.trim())
  validateFilePath(relativePath)
  return relativePath
}

function validateFilePath(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    throw new AppError(
      `File ${filePath} does not exist, no data can be evaluated`
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
