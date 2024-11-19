#!/usr/bin/env node

// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { fetchData, prepareDataToBeExported } from './fetch.js'
import { exit } from 'process'
import { readFile, writeFile } from 'fs/promises'
import YAML from 'yaml'
import path from 'path'
import { AppError } from '@B-S-F/autopilot-utils'

const environmentError = (variable: string) => {
  throw new AppError(`The environment variable [${variable}] is not set!`)
}

const main = async () => {
  try {
    const url = process.env.JIRA_URL ?? environmentError('JIRA_URL')
    const pat = process.env.JIRA_PAT
    const username = process.env.JIRA_USERNAME
    const password = process.env.JIRA_USER_PORTAL_PASSWORD
    const configFilePath =
      process.env.JIRA_CONFIG_FILE_PATH ??
      environmentError('JIRA_CONFIG_FILE_PATH')
    const configData = await YAML.parse(
      await readFile(configFilePath, { encoding: 'utf8' })
    )
    const issues = await fetchData(url, pat, username, password, configData)
    const jsonData = prepareDataToBeExported(issues, url)
    const evidencePath = process.env['evidence_path'] || process.cwd()
    const filepath = path.join(evidencePath, 'data.json')
    await writeFile(filepath, JSON.stringify(jsonData))
  } catch (error) {
    if (error instanceof AppError) {
      console.log(JSON.stringify({ status: 'FAILED', reason: error.message }))
      exit(0)
    } else throw error // to show the stack trace
  }
}

main()
