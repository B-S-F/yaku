import { jest } from '@jest/globals'
import { createConfigsCommand } from './configs'
import { Command } from 'commander'

describe('createConfigsCommand', () => {
  const program = new Command()
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should use the Command library to create the specific commands', () => {
    const expectedCommands = [
      'configs',
      'list',
      'show',
      'create',
      'update',
      'delete',
      'make-config',
      'excel-config',
    ]
    const commandSpy = jest.spyOn(Command.prototype, 'command')

    const configs = program
      .command('configs')
      .alias('cfg')
      .description('Manage configs')
      .showHelpAfterError()

    createConfigsCommand(configs)

    for (const expectedCommand of expectedCommands) {
      expect(commandSpy).toHaveBeenCalledWith(expectedCommand)
    }
  })
})
