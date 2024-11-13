import { Command, Option } from 'commander'
import { login } from '../handlers/login.js'

export function createLoginCommand(program: Command) {
  program
    .command('login [envName]')
    .description('Login to the Yaku CLI')
    .showHelpAfterError()
    .addOption(new Option('-u, --url <url>', 'URL of the Yaku instance'))
    .addOption(
      new Option('-n, --namespace <namespace>', 'Yaku namespace to use')
    )
    .addOption(
      new Option('-w, --web', 'Login via web browser').conflicts('token')
    )
    .addOption(
      new Option(
        ', --admin',
        'Login via web browser and retrieve access token that contains admin permissions if available'
      ).conflicts('token')
    )
    .addOption(
      new Option(
        '-t, --token [token]',
        'Access token for the Yaku environment'
      ).conflicts('web')
    )
    .action(async (envName, options) => {
      await login(envName, options)
    })
}
