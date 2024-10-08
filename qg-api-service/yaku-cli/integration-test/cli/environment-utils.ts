import { RunProcessResult, run } from './process'
import { CommandFacade } from './utils'

export type Environment = {
  name: string
  url: string
  token: string
  namespaceId: number
}

// Left here for roundtrip.test.ts. To be removed if it can be replaced
export async function createEnvironmentAndSwitch(
  executable: string,
  environmentName: string,
  yakuBaseUrl: string,
  token: string,
  namespaceId: number
): Promise<void> {
  const createEnvironmentCommand: string[] = [
    'envs',
    'create',
    environmentName,
    '--url',
    yakuBaseUrl,
    '--token',
    token,
    '--namespace',
    String(namespaceId),
  ]
  await run(executable, createEnvironmentCommand, {
    env: { RUNTIME_CONFIG: '.yakurc-test' },
  })
  await switchToEnvironment(executable, environmentName)
}

export class EnvironmentFacade extends CommandFacade {
  constructor(executablePath: string, runtimeConfig: string = '.yakurc') {
    super(executablePath, runtimeConfig)
  }

  public async runCommand(command: string): Promise<RunProcessResult> {
    return run(this.executablePath, ['envs', ...command.split(' ')], {
      env: { RUNTIME_CONFIG: this.runtimeConfig },
    })
  }

  public async createEnvironment(
    environment: Environment
  ): Promise<RunProcessResult> {
    const createEnvironmentCommand: string[] = [
      'envs',
      'create',
      environment.name,
      '--url',
      environment.url,
      '--token',
      environment.token,
      '--namespace',
      String(environment.namespaceId),
    ]
    return run(this.executablePath, createEnvironmentCommand, {
      env: { RUNTIME_CONFIG: this.runtimeConfig },
    })
  }

  public async switchToEnvironment(
    environmentName: string
  ): Promise<RunProcessResult> {
    return run(this.executablePath, ['envs', 'switch', environmentName], {
      env: { RUNTIME_CONFIG: this.runtimeConfig },
    })
  }

  public async deleteEnvironment(
    environmentNameToDelete: string
  ): Promise<RunProcessResult> {
    return run(
      this.executablePath,
      ['envs', 'delete', environmentNameToDelete],
      { env: { RUNTIME_CONFIG: this.runtimeConfig } }
    )
  }

  public async listEnvironments(): Promise<RunProcessResult> {
    const commandArgs = ['envs', 'list', '-j']

    return run(this.executablePath, commandArgs, {
      env: { RUNTIME_CONFIG: this.runtimeConfig },
    })
  }

  public async updateEnvironmentField(
    environmentName: string,
    key: string,
    value: string
  ): Promise<RunProcessResult> {
    const commandArgs = ['envs', 'update', environmentName, key, value]

    return run(this.executablePath, commandArgs, {
      env: { RUNTIME_CONFIG: this.runtimeConfig },
    })
  }
}
