// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { readFile } from 'fs/promises'
import path from 'path'
import { parse } from 'yaml'

interface ConfigRequirement {
  [key: string]: {
    issues: string[]
  }
}

type Config = {
  requirements: ConfigRequirement
}

export default async function (filePath: string): Promise<Config> {
  const configPath = path.resolve(filePath)
  const data = await readFile(configPath, { encoding: 'utf-8' })
  try {
    return parse(data) as Config
  } catch (e) {
    throw new Error(`Config file ${filePath} is not a valid yaml file`)
  }
}
