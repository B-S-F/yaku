import {
  ApiClient,
  Config,
  getFilenameFromUrl,
  QueryOptions,
} from '@B-S-F/yaku-client-lib'
import fs from 'fs'
import yp from '../yaku-prompts.js'
import path, { sep } from 'path'
import {
  consoleWarnYellow,
  failWithError,
  handleRestApiError,
  handleStandardParams,
  logDownloadedFile,
  logResultAsJson,
  logSuccess,
} from '../common.js'
import { createApiClient, refreshEnvironment } from '../connect.js'
import { Environment, loadEnvironments } from './environment.js'
import { randomUUID } from 'crypto'
import { tmpdir } from 'os'

export async function list(
  client: ApiClient,
  namespace: number | undefined,
  configId: string
) {
  const cf = handleStandardParams(client, namespace, configId, 'configId')
  await logResultAsJson(
    client!.getConfig(namespace!, cf).then((config: Config) => config.files)
  )
}

export async function add(
  client: ApiClient,
  namespace: number | undefined,
  configId: string,
  filepath: string,
  options: any
) {
  const cf = handleStandardParams(client, namespace, configId, 'configId')
  await logSuccess(
    client!.uploadFileToConfig(namespace!, cf, filepath, options.filename),
    `File ${filepath} uploaded`
  )
}

export async function update(
  client: ApiClient,
  namespace: number | undefined,
  configId: string,
  filepath: string,
  options: any
) {
  const cf = handleStandardParams(client, namespace, configId, 'configId')
  const filename = options.filename ?? path.parse(filepath).base

  await logSuccess(
    client!.replaceFileInConfig(namespace!, cf, filepath, filename),
    `File ${filename} replaced`
  )
}

export async function download(
  client: ApiClient,
  namespace: number | undefined,
  configId: string,
  filename: string
) {
  const cf = handleStandardParams(client, namespace, configId, 'configId')
  await logDownloadedFile(client!.downloadFileData(namespace!, cf, filename))
}

export async function deleteFiles(
  client: ApiClient,
  namespace: number | undefined,
  configId: string,
  filenames: string[],
  options: any
) {
  const cf = handleStandardParams(client, namespace, configId, 'configId')

  if (options.all) {
    if (filenames.length > 0) {
      throw new Error('You cannot use --all together with a list of filenames!')
    }
    if (!options.yes) {
      const config = await client!.getConfig(namespace!, cf)
      const shouldDeleteAll = await yp.confirm(
        `Do you really want to delete all files from config #${configId} ('${config.name}')?`
      )
      if (!shouldDeleteAll) {
        return
      }
    }

    await client!.deleteAllFilesFromConfig(namespace!, cf, true)
    await logResultAsJson(
      client!.getConfig(namespace!, cf).then((config: Config) => config.files)
    )
  } else {
    if (filenames.length == 0) {
      throw new Error('You must specify at least one filename!')
    }
    if (!options.yes) {
      const config = await client!.getConfig(namespace!, cf)
      const shouldDelete = await yp.confirm(
        `Do you really want to delete ${filenames.length} file(s) from config #${configId} ('${config.name}')?`
      )
      if (!shouldDelete) {
        return
      }
    }
    await Promise.all(
      filenames.map((filename) => {
        return client!.deleteFileFromConfig(namespace!, cf, filename)
      })
    )
  }
}

export async function syncDown(
  client: ApiClient,
  namespace: number | undefined,
  configId: string,
  directory: string,
  options: any
): Promise<void | void[]> {
  const validatedConfigId = handleStandardParams(
    client,
    namespace,
    configId,
    'configId'
  )

  const existingLocalFiles: fs.Dirent[] = fs.readdirSync(directory, {
    recursive: false,
    encoding: 'utf-8',
    withFileTypes: true,
  })

  const remoteConfig = await client!.getConfig(namespace!, validatedConfigId)
  const remoteFiles: string[] = []
  if (remoteConfig.files.qgConfig) {
    remoteFiles.push(getFilenameFromUrl(remoteConfig.files.qgConfig))
  }
  remoteConfig.files.additionalConfigs?.forEach((file: string) => {
    remoteFiles.push(getFilenameFromUrl(file))
  })

  const filesWhichWillBeOverwritten: string[] = []
  existingLocalFiles.forEach((dirent) => {
    if (remoteFiles.find((f) => f == dirent.name)) {
      if (dirent.isDirectory()) {
        throw new Error(
          'Error: The target directory contains a directory with the same name as a config file. ' +
            'Please remove the directory first from the target directory before trying again.'
        )
      }
      filesWhichWillBeOverwritten.push(dirent.name)
    }
  })

  if (filesWhichWillBeOverwritten.length > 0 && !options.yes) {
    console.log(filesWhichWillBeOverwritten)
    const shouldOverride = await yp.confirm(
      `The above listed files in ${directory} will be overwritten! Do you want to continue?`
    )
    if (!shouldOverride) {
      return
    }
  }

  console.log(`Downloading ${remoteFiles.length} file(s)...`)
  return Promise.all(
    remoteFiles.map(async (filename) => {
      const fileData = await client!.getFileData(
        namespace!,
        validatedConfigId,
        filename
      )
      return fs.promises.writeFile(directory + '/' + filename, fileData.data)
    })
  )
}

export async function syncUp(
  client: ApiClient,
  namespace: number | undefined,
  configId: string,
  directory: string,
  options: any
) {
  const cf = handleStandardParams(client, namespace, configId, 'configId')

  const localFiles: fs.Dirent[] = fs
    .readdirSync(directory, {
      recursive: false,
      encoding: 'utf-8',
      withFileTypes: true,
    })
    .filter((dirent) => dirent.isFile())

  if (localFiles.length == 0) {
    throw new Error(`Aborting. No files found in directory: ${directory}`)
  }

  if (options.clean) {
    await client!.deleteAllFilesFromConfig(namespace!, cf, true)
  }

  const excludePattern = options.exclude
    ? new RegExp(options.exclude)
    : undefined
  await Promise.all(
    localFiles.map(async (file: fs.Dirent) => {
      if (file.name.startsWith('.') && !options.all) {
        // skipping dot files as requested
        return
      }
      if (excludePattern) {
        if (excludePattern.exec(file.name)) {
          return
        }
      }

      await client!.deleteFileFromConfig(namespace!, cf, file.name)

      await client!.uploadFileToConfig(
        namespace!,
        cf,
        directory + sep + file.name,
        file.name
      )
    })
  )

  await logResultAsJson(
    client!.getConfig(namespace!, cf).then((config: Config) => config.files)
  )
}

export async function sync(srcPath: string, dstPath: string, options: any) {
  const src = parseSyncPathParameter(srcPath, 'srcPath')
  const dst = parseSyncPathParameter(dstPath, 'dstPath')

  const envs: Environment[] = loadEnvironments()
  let srcEnv: Environment = extractEnvironment(
    src.envName,
    src.namespaceId,
    envs
  )
  let dstEnv: Environment = extractEnvironment(
    dst.envName,
    dst.namespaceId,
    envs
  )

  // keep envs up to date
  srcEnv = await refreshEnvironment(srcEnv)
  if (dstEnv.name !== srcEnv.name) {
    // avoid double authentication when not necessary
    dstEnv = await refreshEnvironment(dstEnv)
  }

  // create temp directory
  const directory = path.join(tmpdir(), 'yaku-cli-file-sync-' + randomUUID())
  if (fs.existsSync(directory)) {
    // small chances, but just in case
    cleanupSyncFiles(directory)
  }
  console.log(`Creating temp directory ${directory}`)
  fs.mkdirSync(directory)

  // source environment client
  const srcClient = createApiClient(srcEnv)

  // download files from source environment
  try {
    console.log(`Starting sync-down from source environment...`)
    await syncDown(srcClient, srcEnv.namespace, src.configId, directory, {
      yes: true,
    })
    console.log('Download complete.')
  } catch (err) {
    handleRestApiError(err, false)

    // cleanup the temp directory
    cleanupSyncFiles(directory)
    return
  }

  // destination environment client
  const dstClient = createApiClient(dstEnv)

  try {
    // upload files to destination environment
    console.log(`Starting sync-up into the destination environment...`)
    await syncUp(dstClient, dstEnv.namespace, dst.configId, directory, options)

    if (!options.skipSecrets) {
      // identify and present missing secrets in the working environment
      await listMissingSecrets(dstClient, dstEnv.namespace, directory)
    }
  } catch (err) {
    handleRestApiError(err, false)
  }

  // cleanup the temp directory
  cleanupSyncFiles(directory)
}

export function parseSyncPathParameter(param: string, name: string) {
  const pathExp = /^(([a-zA-Z0-9-]+\/)?[0-9]+\/)?[0-9]+$/
  if (!pathExp.test(param)) {
    failWithError(
      `${name} is not valid, please use [[<envName>/]<namespaceId>/]<configId> format`
    )
  }
  const pathParts = param.split('/')
  return {
    envName: pathParts.length == 3 ? pathParts[0] : undefined,
    namespaceId:
      pathParts.length > 1
        ? Number(pathParts[pathParts.length - 2])
        : undefined,
    configId: pathParts[pathParts.length - 1],
  }
}

export function extractEnvironment(
  envName: string | undefined,
  namespaceId: number | undefined,
  envs: Environment[]
): Environment {
  let resultEnv: Environment | undefined
  for (const env of envs) {
    if ((!envName && env.current) || envName === env.name) {
      resultEnv = structuredClone(env)
      if (namespaceId) {
        // use custom namespaceId when available (without updating in .yakurc file)
        resultEnv.namespace = namespaceId
      } else if (!resultEnv.namespace) {
        // cannot continue without a namespaceId
        failWithError(
          `Environment '${resultEnv.name}' does not have a namespace. Please login to select a default, or provide a custom one`
        )
      }
    }
    if (resultEnv) {
      // we have already found it
      return resultEnv
    }
  }
  // end of the line ⛔
  failWithError(
    envName
      ? `Could not find environment: '${envName}'`
      : `Could not find current environment`
  )
}

export function extractSecretsList(directory: string): string[] {
  // regexps to identify secrets usage
  const secretFullExp = /\$\{\{(\s*)secrets\.\w+(\s*)\}\}/g
  const secretBeforeExp = /\$\{\{(\s*)secrets\./g
  const secretAfterExp = /(\s*)\}\}/g

  const secretKeys: string[] = []
  const qgConfigFilePath = path.join(directory, 'qg-config.yaml')
  if (fs.existsSync(qgConfigFilePath)) {
    const contents: string = fs.readFileSync(qgConfigFilePath, {
      encoding: 'utf-8',
    })
    const foundSecrets: string[] | null = contents.match(secretFullExp)
    if (foundSecrets) {
      for (const foundSecret of foundSecrets) {
        const secretKey = foundSecret
          .replace(secretBeforeExp, '')
          .replace(secretAfterExp, '')
        if (secretKeys.indexOf(secretKey) == -1) {
          secretKeys.push(secretKey)
        }
      }
    }
  } else {
    consoleWarnYellow('Source config does not contain qg-config.yaml file')
  }
  return secretKeys
}

export async function listMissingSecrets(
  client: ApiClient,
  namespace: number | undefined,
  directory: string
): Promise<void> {
  const srcSecrets = extractSecretsList(directory)
  if (srcSecrets.length === 0) {
    return
  }
  const dstSecrets: string[] = (
    await client.listAllSecrets(
      namespace!,
      new QueryOptions(1, 20, undefined, undefined, undefined, true)
    )
  ).map(({ name }) => name)
  const missingSecrets = srcSecrets.filter(
    (item) => dstSecrets.indexOf(item) < 0
  )
  if (missingSecrets.length > 0) {
    consoleWarnYellow('The following secrets are missing in the destination:')
    for (const secret of missingSecrets) {
      consoleWarnYellow(`\t- ${secret}`)
    }
  }
}

export function cleanupSyncFiles(directory: string) {
  console.log(`Removing temp directory ${directory}`)
  fs.rmSync(directory, { recursive: true, force: true })
}
