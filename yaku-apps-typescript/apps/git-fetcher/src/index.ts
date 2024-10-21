#!/usr/bin/env node

import { AppError, AppOutput } from '@B-S-F/autopilot-utils'
import { run } from './run.js'
const output = new AppOutput()
try {
  await run(output)
  output.write()
} catch (error) {
  if (error instanceof AppError) {
    output.setStatus('FAILED')
    output.setReason(error.Reason())
    output.write()
    process.exit(0)
  } else {
    throw error // to show the stack trace
  }
}
