#!/usr/bin/env node
import { AutopilotApp } from '@B-S-F/autopilot-utils'
import { createRequire } from 'module'
import { command as fetchCommand } from './commands/fetch/index.js'
const require = createRequire(import.meta.url)
const { version } = require('../package.json')

const app = new AutopilotApp('sonarqube', version, 'Sonarqube connector', [
  fetchCommand,
])

app.run()
