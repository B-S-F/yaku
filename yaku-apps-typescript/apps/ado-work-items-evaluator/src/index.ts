#! /usr/bin/env node

// SPDX-FileCopyrightText: 2022 2023 by grow platform GmbH
// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { AppError, AppOutput } from '@B-S-F/autopilot-utils'
import { readFile } from 'fs/promises'
import { load } from 'js-yaml'
import { exit } from 'process'
import { evaluate } from './evaluate.js'
import { Config, Dictionary } from './types.js'
import { getPathFromEnvVariable } from './util.js'

const CONFIG_FILE_ENV_VAR = 'ADO_CONFIG_FILE_PATH'

const main = async () => {
  try {
    const filepath = getPathFromEnvVariable(
      'ADO_WORK_ITEMS_JSON_NAME',
      'data.json'
    )
    const configFilePath = getPathFromEnvVariable(CONFIG_FILE_ENV_VAR)
    const rawData = await readFile(filepath)
    const configData = await readFile(configFilePath, 'utf8')

    const adoData: Dictionary = JSON.parse(rawData.toString())
    const config = load(configData) as Config

    const appOutput = evaluate(adoData, config)
    appOutput.write()
  } catch (e) {
    if (e instanceof AppError) {
      const appOutput = new AppOutput()
      appOutput.setStatus('FAILED')
      appOutput.setReason(e.Reason())
      appOutput.write()
      exit(0)
    }
    throw e
  }
}

main()
