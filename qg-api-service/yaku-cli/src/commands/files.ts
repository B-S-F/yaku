import {
  ApiClient,
  Config,
  getFilenameFromUrl,
  QueryOptions,
} from '@B-S-F/yaku-client-lib'
import { Command } from 'commander'
import fs from 'fs'
import inquirer from 'inquirer'
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
import { connect, createApiClient, refreshEnvironment } from '../connect.js'
import { Environment, loadEnvironments } from './environment.js'
import { randomUUID } from 'crypto'
import { tmpdir } from 'os'

export function createFilesCommand(program: Command): void {
  let client: ApiClient
  let namespace: number | undefined
  program.hook('preAction', async (thisCommand, actionCommand) => {
    // exclude sync command from connecting to selected environment
    if (actionCommand.name() !== 'sync') {
      const connection = await connect()
      client = connection.client
      namespace = connection.namespace
    }
  })
  program
    .command('list')
    .alias('ls')
    .description('List the file of a config')
    .argument(
      '<configId>',
      'The numeric id of the config for which files are managed'
    )
    .action(async (configId: string) => {
      try {
        list(client, namespace, configId)
      } catch (err) {
        handleRestApiError(err)
      }
    })

  program
    .command('add')
    .alias('a')
    .description('Add a file to a config')
    .argument(
      '<configId>',
      'The numeric id of the config for which files are managed'
    )
    .argument('<filepath>', 'A path to the file which should be uploaded')
    .option(
      '-f, --filename <filename>',
      'Alternative filename for the file to use in the config'
    )
    .action(async (configId: string, filepath: string, options) => {
      try {
        add(client, namespace, configId, filepath, options)
      } catch (err) {
        handleRestApiError(err)
      }
    })

  program
    .command('update')
    .alias('upd')
    .description('Update the file content of a file in a config')
    .argument(
      '<configId>',
      'The numeric id of the config for which files are managed'
    )
    .argument('<filepath>', 'A path to the file which should be uploaded')
    .option('-f, --filename <filename>', 'The file in the config to be updated')
    .action(async (configId: string, filepath: string, options) => {
      try {
        update(client, namespace, configId, filepath, options)
      } catch (err) {
        handleRestApiError(err)
      }
    })

  program
    .command('download')
    .alias('dl')
    .description('Download the file content of a config file')
    .argument(
      '<configId>',
      'The numeric id of the config for which files are managed'
    )
    .argument('<filename>', 'The file in the config to be downloaded')
    .action(async (configId: string, filename: string) => {
      try {
        download(client, namespace, configId, filename)
      } catch (err) {
        handleRestApiError(err)
      }
    })

  program
    .command('delete')
    .description('Delete files from a config')
    .argument(
      '<configId>',
      'The numeric id of the config for which files are managed'
    )
    .argument('[filenames...]', 'The files in the config to be deleted')
    .option(
      '-a, --all',
      'Delete all files. Cannot be used together with a list of filenames.',
      false
    )
    .option(
      '-y, --yes',
      'Skip the confirmation prompt and delete the files immediately.',
      false
    )
    .action(async (configId: string, filenames: string[], options) => {
      try {
        deleteFiles(client, namespace, configId, filenames, options)
      } catch (err) {
        handleRestApiError(err)
      }
    })

  program
    .command('sync-up')
    .description(
      'Upload all files from a local directory into the config. ' +
        'Will not recurse into subdirectories. Will overwrite existing files!'
    )
    .argument(
      '<configId>',
      'The numeric id of the config into which the files should be uploaded'
    )
    .argument('<directory>', 'Path to the local directory')
    .option(
      '--clean',
      'Delete all existing files, before uploading the files',
      false
    )
    .option(
      '-a, --all',
      'Include all files, even those starting with a dot',
      false
    )
    .option(
      '--exclude <excludePattern>',
      'Regular expression pattern of excluded files'
    )
    .action(async (configId: string, directory: string, options) => {
      try {
        syncUp(client, namespace, configId, directory, options)
      } catch (err) {
        handleRestApiError(err)
      }
    })

  program
    .command('sync-down')
    .description('Download all files from a config into a local directory.')
    .argument(
      '<configId>',
      'The numeric id of the config from which the files should be downloaded'
    )
    .argument('<directory>', 'Path to the local directory')
    .option(
      '-y, --yes',
      'Skip the confirmation prompt and overwrite local files immediately.',
      false
    )
    .action(async (configId: string, directory: string, options) => {
      try {
        syncDown(client, namespace, configId, directory, options)
      } catch (err) {
        handleRestApiError(err)
      }
    })

  program
    .command('sync')
    .description(
      'Downloads all files from a source config and uploads them into a destination config (can be from the same or different enviroments and/or namespaces). ' +
        'Does not recurse into subdirectories. Overwrites existing files!'
    )
    .argument(
      '<srcPath>',
      'Path to the source config (from which the files should be downloaded), in the form of [[<envName>/]<namespaceId>/]<configId>. By default, <envName> and <namespaceId> are provided from the selected environment.'
    )
    .argument(
      '<dstPath>',
      'Path to the destination config (into which the files should be uploaded), in the form of [[<envName>/]<namespaceId>/]<configId>. By default, <envName> and <namespaceId> are provided from the selected environment.'
    )
    .option(
      '--clean',
      'Delete all existing files, before uploading the files',
      false
    )
    .option(
      '-a, --all',
      'Include all files, even those starting with a dot',
      false
    )
    .option(
      '--exclude <excludePattern>',
      'Regular expression pattern of excluded files'
    )
    .option('-s --skip-secrets', 'Skip secrets checking')
    .action(async (srcPath: string, dstPath: string, options) => {
      sync(srcPath, dstPath, options)
    })
}

async function list(
  client: ApiClient,
  namespace: number | undefined,
  configId: string
) {
  const cf = handleStandardParams(client, namespace, configId, 'configId')
  await logResultAsJson(
    client!.getConfig(namespace!, cf).then((config: Config) => config.files)
  )
}

async function add(
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

async function update(
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

async function download(
  client: ApiClient,
  namespace: number | undefined,
  configId: string,
  filename: string
) {
  const cf = handleStandardParams(client, namespace, configId, 'configId')
  await logDownloadedFile(client!.downloadFileData(namespace!, cf, filename))
}

async function deleteFiles(
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
      const answer = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'continue',
          message: `Do you really want to delete all files from config #${configId} ('${config.name}')?`,
          default: false,
        },
      ])
      if (!answer.continue) {
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
      const answer = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'continue',
          message: `Do you really want to delete ${filenames.length} file(s) from config #${configId} ('${config.name}')?`,
          default: false,
        },
      ])
      if (!answer.continue) {
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

async function syncDown(
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
    const answer = await inquirer.prompt([
      {
        type: 'confirm',
        default: false,
        name: 'overwrite',
        message: `The above listed files in ${directory} will be overwritten! Do you want to continue?`,
      },
    ])
    if (!answer.overwrite) {
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

async function syncUp(
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

async function sync(srcPath: string, dstPath: string, options: any) {
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

function parseSyncPathParameter(param: string, name: string) {
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

function extractEnvironment(
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

function extractSecretsList(directory: string): string[] {
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

async function listMissingSecrets(
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

function cleanupSyncFiles(directory: string) {
  console.log(`Removing temp directory ${directory}`)
  fs.rmSync(directory, { recursive: true, force: true })
}

// export the private functions for unit test scope
export let _t: any
if (process.env.NODE_ENV === 'test') {
  _t = {
    list,
    add,
    update,
    download,
    deleteFiles,
    syncDown,
    syncUp,
    sync,
    parseSyncPathParameter,
    extractEnvironment,
    extractSecretsList,
    listMissingSecrets,
    cleanupSyncFiles,
  }
}
