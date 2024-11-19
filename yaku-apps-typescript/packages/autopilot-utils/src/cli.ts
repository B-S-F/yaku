// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { Command, program } from 'commander'
import { exit } from 'process'
import { AppError } from './app-error.js'
import { AppOutput } from './app-output.js'
import { InitLogger } from './logger.js'
import { Result } from './types'
/*
 * AutopilotApp is a wrapper around commander.js
 * It provides a simple way to create a CLI app
 * with a common set of features.
 * example:
 * const app = new AutopilotApp(
 *  'my-app',
 *  '0.0.1',
 *  'My App Description',
 *  [
 *   new Command('evaluate')
 *    .description('Evaluate the app')
 *    .action(() => {
 *       const appOutput = new AppOutput()
 *       appOutput.setStatus('GREEN')
 *       appOutput.setReason('Everything is fine.')
 *       appOutput.write()
 *    })
 *  ]
 * )
 * app.run()
 *
 * The above example will create a CLI app with a single command
 * called evaluate. When the evaluate command is run, the app will
 * output a green status with the reason "Everything is fine."
 *
 * If you want to use a logger, you can use the GetLogger function
 * to get a logger instance. The logger will be initialized with
 * the name of the app and the log level set to info (unless the
 * DEBUG environment variable is set)
 */
export class AutopilotApp {
  public results: Result[] = []
  constructor(
    name: string,
    version: string,
    description: string,
    commands: Command[]
  ) {
    program.name(name).version(version).description(description)
    commands.forEach((command) => {
      program.addCommand(command)
    })
    const logLevel = process.env.DEBUG ? 'debug' : 'info'
    InitLogger(name, logLevel)
  }

  async run() {
    try {
      await program.parseAsync(process.argv)
    } catch (e) {
      if (e instanceof AppError) {
        const appOutput = new AppOutput()
        appOutput.setStatus('FAILED')
        appOutput.setReason(e.Reason())
        appOutput.write()
        exit(0)
      }
      throw e
    }
  }
}

export const AutopilotAppCommand = Command
