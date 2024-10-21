#!/usr/bin/env node

import { AppError, AppOutput } from '@B-S-F/autopilot-utils'
import { readFile } from 'fs/promises'
import YAML from 'yaml'
import { exit } from 'process'
import { checkIssues, evaluate } from './evaluate.js'
import { getPathFromEnvVariable } from './util.js'

const CONFIG_FILE_ENV_VAR = 'JIRA_CONFIG_FILE_PATH'

export const run = async () => {
  try {
    //read config file
    const configFilePath = getPathFromEnvVariable(CONFIG_FILE_ENV_VAR)
    const config = await YAML.parse(
      await readFile(configFilePath, { encoding: 'utf8' })
    )

    //read jira tickets data
    const filepath = getPathFromEnvVariable(
      'JIRA_ISSUES_JSON_NAME',
      'data.json'
    )
    const rawData = await readFile(filepath)
    const jiraData = JSON.parse(rawData.toString())

    const invalidIssues = checkIssues(jiraData, config)

    const appOutput = evaluate(invalidIssues)
    appOutput.write()
  } catch (e) {
    if (e instanceof AppError) {
      console.log(e.Reason())
      const appOutput = new AppOutput()
      appOutput.setStatus('FAILED')
      appOutput.setReason(e.Reason())
      appOutput.write()
      exit(0)
    }
    throw e
  }
}

run()
