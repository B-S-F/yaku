import { jest } from '@jest/globals'
import { createNamespacesSubcommands } from './namespaces'
import { Command } from 'commander'

describe('createNamespacesSubcommands', () => {
  const program = new Command()
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should use the Command library to create the specific commands', () => {
    const expectedCommands = [
      'namespaces',
      'list',
      'switch [namespaceId]',
      'create',
      'show',
      'update',
    ]
    const commandSpy = jest.spyOn(Command.prototype, 'command')

    const namespaces = program
      .command('namespaces')
      .alias('ns')
      .description('Manage namespaces')
      .showHelpAfterError()

    createNamespacesSubcommands(namespaces)

    for (const expectedCommand of expectedCommands) {
      expect(commandSpy).toHaveBeenCalledWith(expectedCommand)
    }
  })
})
