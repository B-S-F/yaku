import { jest } from '@jest/globals'
import { createFindingsSubcommands } from './findings'
import { Command } from 'commander'

describe('createFindingsCommand', () => {
  const program = new Command()
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should use the Command library to create the specific commands', () => {
    const expectedCommands = ['findings', 'list', 'resolve', 'reopen']
    const commandSpy = jest.spyOn(Command.prototype, 'command')

    const findings = program
      .command('findings')
      .alias('fnd')
      .description('Manage findings of a config')
      .showHelpAfterError()

    createFindingsSubcommands(findings)

    for (const expectedCommand of expectedCommands) {
      expect(commandSpy).toHaveBeenCalledWith(expectedCommand)
    }
  })
})
