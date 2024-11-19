// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { Command } from 'commander'
import { about } from '../handlers/about.js'

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
      about(options)
    })
}
