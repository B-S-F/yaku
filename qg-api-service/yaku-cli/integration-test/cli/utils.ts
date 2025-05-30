// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { RunProcessResult, run } from './process'

export class CommandFacade {
  constructor(
    protected executablePath: string,
    protected runtimeConfig = '.yakurc',
  ) {}

  public async runCommand(command: string): Promise<RunProcessResult> {
    return run(this.executablePath, command.split(' '), {
      env: { RUNTIME_CONFIG: this.runtimeConfig },
    })
  }
}
