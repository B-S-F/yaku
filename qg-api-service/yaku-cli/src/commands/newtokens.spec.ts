// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { jest } from '@jest/globals'
import { createNewTokensSubcommands } from './newtokens'
import { Command } from 'commander'

describe('createNewTokensSubcommands', () => {
  const program = new Command()
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should use the Command library to create the specific commands', () => {
    const expectedCommands = ['tokens', 'list', 'create', 'revoke']
    const commandSpy = jest.spyOn(Command.prototype, 'command')

    const tokens = program
      .command('tokens')
      .alias('tks')
      .description('Manage your user tokens')
      .showHelpAfterError()

    createNewTokensSubcommands(tokens)

    for (const expectedCommand of expectedCommands) {
      expect(commandSpy).toHaveBeenCalledWith(expectedCommand)
    }
  })
})
