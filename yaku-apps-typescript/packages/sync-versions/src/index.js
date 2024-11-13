#! /usr/bin/env node

/* 
 * Copyright (c) 2022, 2023 by grow platform GmbH 
 */

const replace = require('replace-in-file')

async function run() {
  if (process.argv.length < 4) {
    console.error('Usage: sync-versions <scope> <version>')
    return process.exit(1)
  }

  const [, , scope, version] = process.argv

  const regex = new RegExp(`(?<="dependencies":\\s*\\{[^\}]*"${scope}\\/[^"]+": ")[^"]*(?=")`, 'gs')

  try {
    const options = {
      files: 'package.json',
      from: regex,
      to: `^${version}`,
    }

    const results = await replace(options)

    if (results[0].hasChanged) {
      console.log(process.cwd(), 'dependencies synced')
    }
  } catch (error) {
    console.error('Error occurred:', error)
  }
}

run()
