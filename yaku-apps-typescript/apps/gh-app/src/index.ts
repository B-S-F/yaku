#!/usr/bin/env node

// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { authCmd } from './auth.js'
import {
  AutopilotApp,
  AutopilotAppCommand,
  InitLogger,
} from '@B-S-F/autopilot-utils'
import * as packageJson from '../package.json'

const version = packageJson.version
export const APP_NAME = 'gh-app'

const app = new AutopilotApp(
  APP_NAME,
  version,
  'CLI to interact with a GitHub App.',
  [
    new AutopilotAppCommand('auth')
      .description('Authenticate as a GH App installation.')
      .option('--token-only', 'Print only the token.')
      .action((options) => {
        if (options.tokenOnly) {
          InitLogger('gh-app', 'error')
        } else {
          InitLogger('gh-app', 'info')
        }
        authCmd(options)
      }),
  ],
)

app.run()
