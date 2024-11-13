import { jest } from '@jest/globals'
import { createAboutCommand } from './about'
import { Command } from 'commander'

describe('createAboutCommand', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should use the Command library to create the specific commands', () => {
    const commandSpy = jest.spyOn(Command.prototype, 'command')

    createAboutCommand(new Command())

    expect(commandSpy).toHaveBeenCalledWith('about')
  })
})
