import { RunProcessResult, run } from './process'

export class CommandFacade {
  constructor(
    protected executablePath: string,
    protected runtimeConfig: string = '.yakurc'
  ) {}

  public async runCommand(command: string): Promise<RunProcessResult> {
    return run(this.executablePath, command.split(' '), {
      env: { RUNTIME_CONFIG: this.runtimeConfig },
    })
  }
}
