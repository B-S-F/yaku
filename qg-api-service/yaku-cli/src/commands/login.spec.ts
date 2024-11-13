import { jest } from '@jest/globals'
import { createLoginCommand } from './login'
import { Command } from 'commander'

describe('createLoginCommand', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should use the Command library to create the specific commands', () => {
    const commandSpy = jest.spyOn(Command.prototype, 'command')

    createLoginCommand(new Command())

    expect(commandSpy).toHaveBeenCalledWith('login [envName]')
  })
})
