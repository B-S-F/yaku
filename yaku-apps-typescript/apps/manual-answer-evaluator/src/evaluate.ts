#! /usr/bin/env node
/**
 * Copyright (c) 2022, 2023 by grow platform GmbH
 */

import { AppError, AppOutput, InitLogger } from '@B-S-F/autopilot-utils'
import {
  readEnvAndDoEvaluation,
  ManualAnswerEvaluatorEnv,
} from './manualAnswerEvaluator/readEnvAndDoEvaluation.js'

try {
  InitLogger('manualAnswerEvaluator')
  readEnvAndDoEvaluation(process.env as ManualAnswerEvaluatorEnv)
} catch (error) {
  if (error instanceof AppError) {
    const output = new AppOutput()
    output.setReason(error.message)
    output.setStatus('FAILED')
    output.write()
    process.exit(0)
  } else {
    throw error
  }
}
