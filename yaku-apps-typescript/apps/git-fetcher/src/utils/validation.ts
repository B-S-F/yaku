import * as fs from 'fs'
import YAML from 'yaml'
import { SafeParseReturnType } from 'zod'
import { fromZodError } from 'zod-validation-error'
import {
  GitFetcherConfig,
  GitFetcherConfigSchema,
} from '../model/config-file-data.js'
import { ConfigurationError } from '../run.js'

export async function validateFetcherConfig(
  filePath: string
): Promise<GitFetcherConfig> {
  const uncheckedGitFetcherConfig: unknown = await YAML.parse(
    fs.readFileSync(filePath, { encoding: 'utf8' })
  )

  const result: SafeParseReturnType<unknown, GitFetcherConfig> =
    GitFetcherConfigSchema.safeParse(uncheckedGitFetcherConfig)
  if (result.success) {
    return result.data
  } else {
    throw new ConfigurationError(fromZodError(result.error).message)
  }
}
