// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { ApiClient } from '@B-S-F/yaku-client-lib'
import { Command } from 'commander'
import { handleRestApiError } from '../common.js'
import { connect } from '../connect.js'
import {
  add,
  deleteFiles,
  download,
  list,
  sync,
  syncDown,
  syncUp,
  update,
} from '../handlers/files.js'

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
