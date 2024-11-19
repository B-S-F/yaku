// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { Command } from 'commander'
import { handleRestApiError } from '../common.js'
import { ApiClient } from '@B-S-F/yaku-client-lib'
import { connect } from '../connect.js'
import { info } from '../handlers/info.js'

export function createInfoCommand(program: Command) {
  let client: ApiClient
  program
    .command('info')
    .description('Get service info')
    .showHelpAfterError()
    .option('--only <name>', 'Get only the specified info')
    .action(async (options) => {
      try {
        await info(client, options)
      } catch (err) {
        handleRestApiError(err)
      }
    })
    .hook('preAction', async () => {
      client = (await connect()).client
    })
}
