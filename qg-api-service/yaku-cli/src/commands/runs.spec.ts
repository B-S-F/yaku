import { jest } from '@jest/globals'
import { createRunsSubcommands } from './runs'
import { Command } from 'commander'

describe('createRunsSubcommands', () => {
  const program = new Command()
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should use the Command library to create the releases-specific commands', () => {
    const expectedCommands = [
      'runs',
      'list',
      'show',
      'create',
      'result',
      'evidences',
      'delete',
    ]
    const commandSpy = jest.spyOn(Command.prototype, 'command')

    const runs = program
      .command('runs')
      .alias('r')
      .description('Manage qg runs')
      .showHelpAfterError()

    createRunsSubcommands(runs)

    for (const expectedCommand of expectedCommands) {
      expect(commandSpy).toHaveBeenCalledWith(expectedCommand)
    }
  })
})
