// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { jest } from '@jest/globals'
import { createInfoCommand } from './info'
import { Command } from 'commander'

describe('createInfoCommand', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should use the Command library to create the specific commands', () => {
    const commandSpy = jest.spyOn(Command.prototype, 'command')

    createInfoCommand(new Command())

    expect(commandSpy).toHaveBeenCalledWith('info')
  })
})
