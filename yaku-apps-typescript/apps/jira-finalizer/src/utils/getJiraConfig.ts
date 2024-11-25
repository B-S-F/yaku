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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    throw new Error(`Config file ${filePath} is not a valid yaml file`)
  }
}
