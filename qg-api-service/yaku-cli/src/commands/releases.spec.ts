// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { jest } from '@jest/globals'
import { Command } from 'commander'
import { createReleasesSubcommands } from './releases'

describe('createReleasesSubcommands', () => {
  const program = new Command()
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should use the Command library to create the releases-specific commands', () => {
    const expectedCommands = ['releases', 'list', 'show', 'delete']
    const commandSpy = jest.spyOn(Command.prototype, 'command')

    const releases = program
      .command('releases')
      .alias('re')
      .description('Manage releases')
      .showHelpAfterError()

    createReleasesSubcommands(releases)

    for (const expectedCommand of expectedCommands) {
      expect(commandSpy).toHaveBeenCalledWith(expectedCommand)
    }
  })
})
