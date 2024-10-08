#! /usr/bin/env node
import colors from 'colors'
import { Command } from 'commander'

import { createConfigsCommand } from './commands/configs.js'

import { createFilesCommand } from './commands/files.js'
import { createNamespacesSubcommands } from './commands/namespaces.js'
import { createRunsSubcommands } from './commands/runs.js'
import { createSecretsSubcommands } from './commands/secrets.js'
import { createFindingsSubcommands } from './commands/findings.js'
import { createLoginCommand } from './commands/login.js'
import { createAboutCommand } from './commands/about.js'
import { config } from './config.js'
import { createInfoCommand } from './commands/info.js'
import { createEnvsSubcommands } from './commands/environment.js'
import { createNewTokensSubcommands } from './commands/newtokens.js'

colors.enable()

const program = new Command()

program.description('CLI for Yaku Service')
program.name('yaku')
program.option(
  '-k, --no-ssl-verify',
  'disable TLS certificate validation',
  (): boolean => {
    console.error('Disabling TLS certificate validation!')
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    return false
  }
)

program.allowExcessArguments(false)

createAboutCommand(program)

createInfoCommand(program)

createLoginCommand(program)

program
  .command('version')
  .aliases(['V', 'v'])
  .description('Output the current version of the CLI')
  .showHelpAfterError()
  .action(() => {
    console.log(config.version)
  })

const envs = program
  .command('environments')
  .alias('envs')
  .description('Manage environments')
  .showHelpAfterError()

createEnvsSubcommands(envs)

const runs = program
  .command('runs')
  .alias('r')
  .description('Manage qg runs')
  .showHelpAfterError()

createRunsSubcommands(runs)

const configs = program
  .command('configs')
  .alias('cfg')
  .description('Manage configs')
  .showHelpAfterError()

createConfigsCommand(configs)

const files = program
  .command('files')
  .alias('f')
  .description('Manage files of a config')
  .showHelpAfterError()

createFilesCommand(files)

const findings = program
  .command('findings')
  .alias('fnd')
  .description('Manage findings of a config')
  .showHelpAfterError()

createFindingsSubcommands(findings)

const secrets = program
  .command('secrets')
  .alias('s')
  .description('Manage secrets')
  .showHelpAfterError()

createSecretsSubcommands(secrets)

const namespaces = program
  .command('namespaces')
  .alias('ns')
  .description('Manage namespaces')
  .showHelpAfterError()

createNamespacesSubcommands(namespaces)

const tokens = program
  .command('tokens')
  .alias('tks')
  .description('Manage your user tokens')
  .showHelpAfterError()

createNewTokensSubcommands(tokens)

program.parseAsync(process.argv)
