#! /usr/bin/env node

// SPDX-FileCopyrightText: 2022 2023 by grow platform GmbH
// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { AxiosInstance } from 'axios'
import * as fs from 'fs'
import { exit } from 'process'
import { createHttpClient } from './utils/http-client.js'
import { ApiDetails, getApiDetails } from './utils/api-details.js'
import { getPath } from './utils/util.js'
import {
  EnvironmentError,
  WorkItemsNotFoundError,
} from './utils/custom-errors.js'
import { readFile, writeFile } from 'fs/promises'
import YAML from 'yaml'
import path from 'path'
import { AppOutput, InitLogger } from '@B-S-F/autopilot-utils'
import { WorkItemConfigData } from './work-item/work-item-config-data.js'
import { Headers, WorkItem, createHeaders } from './work-item/work-item.js'

const EVIDENCE_PATH_ENV_VAR = 'evidence_path'
const CONFIG_FILE_ENV_VAR = 'ADO_CONFIG_FILE_PATH'

const main = async () => {
  const logger = InitLogger('ado-fetcher', 'info')
  logger.debug('Starting ADO Fetcher')
  try {
    if (process.env.NODE_TLS_REJECT_UNAUTHORIZED == '0') {
      throw new EnvironmentError(
        'Environment variable NODE_TLS_REJECT_UNAUTHORIZED must not be set to 0 for security reasons',
      )
    }
    const evidencePath: string = getEvidencePath()
    const evaluatorConfigFilePath = getConfigPath()
    const outputFileName: string =
      process.env.ADO_WORK_ITEMS_JSON_NAME ?? 'data.json'
    const outputFilePath = path.join(evidencePath, outputFileName)
    logger.debug(`Output file path: ${outputFilePath}`)
    if (fs.existsSync(outputFilePath)) {
      throw new EnvironmentError(
        `File ${outputFilePath} exists already, can't write evidence!`,
      )
    }
    const enableProxy = process.env.ADO_APPLY_PROXY_SETTINGS === 'true'
    const apiDetails: ApiDetails = getApiDetails()
    logger.debug(`API Details: ${JSON.stringify(apiDetails)}`)
    // setup config
    const configFileData = await YAML.parse(
      await readFile(evaluatorConfigFilePath, { encoding: 'utf8' }),
    )
    const configData: WorkItemConfigData = new WorkItemConfigData(
      configFileData,
    )
    const httpClient: AxiosInstance = createHttpClient({
      azureDevOpsUrl: apiDetails.url,
      enableProxy,
    })
    const headers: Headers = createHeaders(apiDetails.personalAccessToken)

    // get data
    logger.debug(`Starting to fetch data...`)
    const workItem = new WorkItem(headers, httpClient, configData, apiDetails)
    logger.debug(`Querying work item references...`)
    const workItemReferences = await workItem.queryReferences()
    logger.debug(`Found ${workItemReferences.length} work item references`)
    const workItems = await workItem.getDetails(workItemReferences)
    logger.debug(`Found ${workItems.length} work items`)
    const workItemsFiltered = workItem.filterData(workItems)
    logger.debug(`Filtered down to ${workItemsFiltered.length} work items`)
    const dataToExport = {
      workItems: workItemsFiltered,
    }

    await writeFile(outputFilePath, JSON.stringify(dataToExport))
    logger.debug(`Wrote data to ${outputFilePath}`)
  } catch (error: any) {
    console.error(error)
    exit(1)
  }
}

function getEvidencePath() {
  const evidencePath: string = getPath(EVIDENCE_PATH_ENV_VAR)
  try {
    fs.accessSync(evidencePath, fs.constants.W_OK)
  } catch (e) {
    throw new EnvironmentError(`${evidencePath} is not writable!`)
  }
  if (!fs.statSync(evidencePath).isDirectory()) {
    throw new EnvironmentError(
      `${EVIDENCE_PATH_ENV_VAR} does not point to a directory!`,
    )
  }
  return evidencePath
}

function getConfigPath() {
  const configPath: string = getPath(CONFIG_FILE_ENV_VAR)
  try {
    fs.accessSync(configPath, fs.constants.R_OK)
  } catch (e) {
    throw new EnvironmentError(`${configPath} is not readable!`)
  }
  if (!fs.statSync(configPath).isFile()) {
    throw new EnvironmentError(
      `${CONFIG_FILE_ENV_VAR} does not point to a file!`,
    )
  }
  return configPath
}

try {
  main()
} catch (error) {
  if (
    error instanceof EnvironmentError ||
    error instanceof WorkItemsNotFoundError
  ) {
    const output = new AppOutput()
    output.setStatus('FAILED')
    output.setReason(error.Reason())
    output.write()
    process.exit(0)
  } else {
    throw error // to show the stack trace
  }
}
