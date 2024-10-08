#! /usr/bin/env node
import { Command } from 'commander'
import executeTest from './test-execution.js'

async function run() {
  const program = new Command()

  const {
    YAKU_NAMESPACE_ID = '1',
    YAKU_API_TOKEN = '',
    YAKU_BASE_URL = 'http://localdev.me/api/v1',
  } = process.env

  program
    .description('A scale test for yaku')
    .option(
      '-r, --rounds <number>',
      'Number of parallel calls, should be an even number, default is 10'
    )
    .parse(process.argv)

  const options = program.opts()
  let numberOfRuns = 10
  if (options.rounds) {
    numberOfRuns = parseInt(options.rounds)
    if (isNaN(numberOfRuns)) {
      console.error('Option rounds has to be a number')
      process.exit(1)
    }
  }
  const namespaceId = parseInt(YAKU_NAMESPACE_ID)
  if (isNaN(namespaceId)) {
    console.error('Environment variable YAKU_NAMESPACE_ID has to be a number')
    process.exit(1)
  }
  let baseUrl: string
  try {
    baseUrl = new URL(YAKU_BASE_URL).toString()
  } catch (err) {
    console.error('Environment variable YAKU_BASE_URL has to contain an url')
    process.exit(1)
  }
  const token = YAKU_API_TOKEN
  if (!token) {
    console.error('Environment variable YAKU_API_TOKEN is a required parameter')
    process.exit(1)
  }

  console.log(
    `Start test with base url ${baseUrl} and namespace id ${namespaceId}. Executing ${numberOfRuns} runs`
  )

  executeTest(baseUrl, token, namespaceId, numberOfRuns)
}

run()
