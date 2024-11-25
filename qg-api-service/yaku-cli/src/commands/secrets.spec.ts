// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { jest } from '@jest/globals'
import { createSecretsSubcommands } from './secrets'
import { Command } from 'commander'

describe('createSecretsSubcommands', () => {
  const program = new Command()
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should use the Command library to create the releases-specific commands', () => {
    const expectedCommands = ['secrets', 'list', 'create', 'update', 'delete']
    const commandSpy = jest.spyOn(Command.prototype, 'command')

    const secrets = program
      .command('secrets')
      .alias('s')
      .description('Manage secrets')
      .showHelpAfterError()

    createSecretsSubcommands(secrets)

    for (const expectedCommand of expectedCommands) {
      expect(commandSpy).toHaveBeenCalledWith(expectedCommand)
    }
  })
})
