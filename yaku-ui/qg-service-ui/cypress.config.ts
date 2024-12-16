// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { defineConfig } from 'cypress'
import { initPlugin as initVisualRegressionDiff } from '@frsource/cypress-plugin-visual-regression-diff/plugins'
import { promises as fsPromises } from 'fs'
import initCodeCoverageTask from '@cypress/code-coverage/task'
import MochawesomeReporter from 'cypress-mochawesome-reporter/plugin'

const viewportWidth = 1920
const viewportHeight = 1080

export default defineConfig({
  env: {
    // cypress-plugin-visual-regression-diff configuration
    pluginVisualRegressionDiffConfig: { threshold: 0.2 },
    pluginVisualRegressionScreenshotConfig: { capture: 'viewport' },
  },
  e2e: {
    baseUrl: 'http://localhost:4999/',
    async setupNodeEvents(on, config) {
      initVisualRegressionDiff(on, config)
      initCodeCoverageTask(on, config)

      if (process.env.REPORTER) {
        // TODO: rename the file in the report to match the links(<name>.actual.png)
        MochawesomeReporter(on)
      }

      on('before:browser:launch', (browser, browserLaunch) => {
        if (browser.name === 'chrome') {
          browserLaunch.args.push(
            `--window-size=${viewportWidth},${viewportHeight}`,
          )
        }
        return browserLaunch
      })

      on('task', {
        deleteFolder(folderName) {
          fsPromises.rmdir(folderName, { recursive: true })
          return null
        },
      })

      return config
    },
    reporter: 'cypress-multi-reporters',
    reporterOptions: {
      configFile: 'cypress/reporterConfigs.json',
    },
    screenshotsFolder:
      process.env.pluginVisualRegressionImagesPath ??
      'cypress/e2e/__image_snapshots__',
    videoCompression: false,
    viewportWidth,
    viewportHeight,
  },
})
