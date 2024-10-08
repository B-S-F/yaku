import { Command } from 'commander'
import { readFileSync } from 'fs'
import path from 'path'
import { config } from '../config.js'

export function createAboutCommand(program: Command) {
  program
    .command('about')
    .description('Get information on the cli')
    .showHelpAfterError()

    .option(
      '--sbom',
      'Get an cycloneDX sbom with all components used by this command line tool'
    )
    .action((options) => {
      if (options.sbom) {
        const dirname = new URL('.', import.meta.url).pathname
        const sbom = JSON.parse(
          readFileSync(path.join(dirname, config.sbomFileName)).toString(
            'utf-8'
          )
        )
        console.log(JSON.stringify(sbom, null, 2))
      } else {
        console.log('Yaku Client CLI\n')
        console.log('Copyright Bosch Software Flow\n')
        console.log(
          `Use option '--sbom' to get further details on used open source components`
        )
      }
    })
}
