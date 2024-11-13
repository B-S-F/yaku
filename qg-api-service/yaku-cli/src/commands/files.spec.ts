import { jest } from '@jest/globals'
import { createFilesCommand } from './files'
import { Command } from 'commander'

describe('createFilesCommand', () => {
  const program = new Command()
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should use the Command library to create the specific commands', () => {
    const expectedCommands = [
      'files',
      'list',
      'add',
      'update',
      'download',
      'delete',
      'sync-up',
      'sync-down',
      'sync',
    ]
    const commandSpy = jest.spyOn(Command.prototype, 'command')

    const files = program
      .command('files')
      .alias('f')
      .description('Manage files of a config')
      .showHelpAfterError()

    createFilesCommand(files)

    for (const expectedCommand of expectedCommands) {
      expect(commandSpy).toHaveBeenCalledWith(expectedCommand)
    }
  })
})
