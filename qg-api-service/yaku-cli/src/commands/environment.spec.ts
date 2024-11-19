// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { jest } from '@jest/globals'
import { createEnvsSubcommands } from './environment'
import { Command } from 'commander'

describe('createEnvsSubcommands', () => {
  const program = new Command()
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should use the Command library to create the env-specific commands', () => {
    const expectedCommands = [
      'environments',
      'update',
      'list',
      'edit',
      'switch [envName]',
      'create',
      'delete',
    ]
    const commandSpy = jest.spyOn(Command.prototype, 'command')

    const envs = program
      .command('environments')
      .alias('envs')
      .description('Manage environments')
      .showHelpAfterError()

    createEnvsSubcommands(envs)

    for (const expectedCommand of expectedCommands) {
      expect(commandSpy).toHaveBeenCalledWith(expectedCommand)
    }
  })
})
