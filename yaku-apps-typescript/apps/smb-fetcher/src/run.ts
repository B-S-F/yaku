/**
 * Copyright (c) 2023 by grow platform GmbH
 */
import {
  AppError,
  AppOutput,
  GetLogger,
  InitLogger,
  Output,
} from '@B-S-F/autopilot-utils'
import fs from 'fs/promises'
import * as fs_sync from 'fs'
import path from 'path'
import SMB2, { IStats } from 'v9u-smb2'
import YAML from 'yaml'
import z from 'zod'

class FetchError extends AppError {
  constructor(reason: string) {
    super(reason)
    this.name = 'FetchError'
  }

  Reason(): string {
    return super.Reason()
  }
}

const validateFetcherConfig = async (filePath: string) => {
  const config = await YAML.parse(
    await fs.readFile(filePath, { encoding: 'utf-8' }),
  )

  return configSchema().parse(config)
}

const validateEnvironment = () => {
  const envSchema = z.object({
    SMB_USERNAME: z.string(),
    SMB_PASSWORD: z.string(),
    SMB_CONFIG_PATH: z.string(),
  })

  return envSchema.parse(process.env)
}

const configSchema = () => {
  const configSchema = z.object({
    share: z.string(),
    domain: z.string().default('EMEA'),
    files: z.array(z.string().min(1)),
  })

  return configSchema
}

export const retry = async <T>(
  fn: (smbPath: string, smbClient: SMB2) => Promise<T>,
  smbPath: string,
  smbClient: SMB2,
  retries = 5,
  delay = 100,
): Promise<T> => {
  const logger = GetLogger()
  try {
    return await fn(smbPath, smbClient)
  } catch (error) {
    if (retries > 1) {
      logger.warn(`retry SMB operation on ${smbPath}`)

      await new Promise((resolve) => setTimeout(resolve, delay))

      return await retry(fn, smbPath, smbClient, retries - 1, delay * 2)
    } else {
      logger.error(`All SMB operation retries on ${smbPath} have failed`)
      throw new FetchError(`Failed SMB operation on ${smbPath}`)
    }
  }
}

const outputs: Output[] = []

const fetchFile = async (
  destPath: string,
  smbPath: string,
  smbClient: SMB2,
) => {
  const logger = GetLogger()

  const smbstats: IStats = await smbClient.stat(smbPath)
  const content = await smbClient.readFile(smbPath)

  const dirName = path.dirname(destPath)
  if (!fs_sync.existsSync(dirName)) {
    fs_sync.mkdirSync(dirName, { recursive: true })
  }

  fs_sync.writeFileSync(destPath, content)
  fs_sync.utimesSync(destPath, smbstats.atime, smbstats.mtime)

  logger.info(`${smbPath} is fetched successfuly`)
  const currentPath = path.resolve('./')

  const relativePath = destPath.replace(currentPath, '.').replace('./', '')
  outputs.push({ fetched: `${relativePath}` })
}

const traversePath = async (
  destPath: string,
  smbPath: string,
  smbClient: SMB2,
) => {
  const smbstats: IStats = await smbClient.stat(smbPath)
  if (smbstats.isDirectory()) {
    const dirInfo = await smbClient.readdir(smbPath, { stats: true })

    if (!fs_sync.existsSync(destPath)) {
      fs_sync.mkdirSync(destPath, { recursive: true })
      fs_sync.utimesSync(destPath, smbstats.atime, smbstats.mtime)
    }

    await Promise.all(
      dirInfo.map(async (item: any) => {
        const newDestPath = path.join(destPath, item.name)
        const newsmbPath = `${smbPath}\\${item.name}`

        await traversePath(newDestPath, newsmbPath, smbClient)
      }),
    )
  } else {
    await retry(
      async () => fetchFile(destPath, smbPath, smbClient),
      smbPath,
      smbClient,
    ).catch((error: any) => {
      throw error
    })
  }
}

export const run = async () => {
  const logger = InitLogger('smb-fetcher', 'info')
  const output = new AppOutput()

  try {
    const env = validateEnvironment()

    const config = await validateFetcherConfig(env.SMB_CONFIG_PATH)

    const smbOptions = {
      share: config.share,
      domain: config.domain,
      username: env.SMB_USERNAME,
      password: env.SMB_PASSWORD,
      autoCloseTimeout: 0,
    }

    const smbClient = new SMB2(smbOptions)

    for (const file of config.files) {
      const cleanSmbPath = file.replace(/(\\)\\+/g, '$1').replace(/\\+$/, '')
      const cleanFsPath = file.replaceAll('\\', path.sep).replace(/\/+$/, '')
      const filepath = {
        smbpath: cleanSmbPath,
        fspath: cleanFsPath.split(path.sep).at(-1) ?? '',
      }
      const outputPath = path.resolve('./', filepath.fspath)
      await traversePath(outputPath, filepath.smbpath, smbClient)
    }
    await smbClient.disconnect()

    outputs.forEach((item) => output.addOutput(item))
    output.write()
  } catch (error: any) {
    if (error instanceof AppError) {
      output.setStatus('FAILED')
      output.setReason(error.Reason())
      logger.error(error.Reason())

      output.write()
      process.exit(0)
    } else {
      throw error
    }
  }
}
