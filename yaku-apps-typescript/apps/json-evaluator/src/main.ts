// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { AppOutput, AppError } from '@B-S-F/autopilot-utils'
import { parseConfig } from './parse-config'
import { Logger } from './logger'
import { evaluate } from './evaluate'
import { getPathFromEnvVariable } from './util'

export const checkEnvironmentVariables = () => {
  if (!process.env.JSON_INPUT_FILE) {
    throw new AppError('Env variable "JSON_INPUT_FILE" is not provided')
  }
  if (!process.env.JSON_CONFIG_FILE) {
    throw new AppError('Env variable "JSON_CONFIG_FILE" is not provided')
  }
}

export const main = async () => {
  try {
    const logger = new Logger()
    checkEnvironmentVariables()
    const configFilePath = getPathFromEnvVariable('JSON_CONFIG_FILE')
    const dataFilePath = getPathFromEnvVariable('JSON_INPUT_FILE')
    const config = await parseConfig(configFilePath)

    const appOutput = await evaluate(dataFilePath, config)
    appOutput.write()
    logger.end()
  } catch (e) {
    if (e instanceof AppError) {
      console.log(e)
      console.log(e.Reason())
      const appOutput = new AppOutput()
      appOutput.setStatus('FAILED')
      appOutput.setReason(e.Reason())
      appOutput.write()
      process.exit(0)
    } else {
      const error = e as { name: string; message: string }
      const errMsg =
        error.name && error.message
          ? `${error.name}: ${error.message}`
          : `${error}`
      console.error(errMsg.red)
      throw e // to show stack trace
    }
  }
}
