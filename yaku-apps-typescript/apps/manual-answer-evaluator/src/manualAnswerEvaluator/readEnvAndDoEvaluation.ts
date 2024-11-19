/**
 * Copyright (c) 2022, 2023 by grow platform GmbH
 */

import { AppError } from '@B-S-F/autopilot-utils'
import { evaluate } from './manualAnswer.js'

export interface ManualAnswerEvaluatorEnv {
  manual_answer_file?: string
  expiration_time?: string
  last_modified_date_override?: string
}

class EnvironmentError extends AppError {
  constructor(message: string) {
    super(message)
    this.name = 'EnvironmentError'
  }
  Reason(): string {
    return super.Reason()
  }
}

export function readEnvAndDoEvaluation(env: ManualAnswerEvaluatorEnv) {
  if (!env.manual_answer_file) {
    throw new EnvironmentError(
      'Environment variable manual_answer_file must be set',
    )
  }
  if (!env.expiration_time) {
    throw new EnvironmentError(
      'Environment variable expiration_time must be set',
    )
  }
  const { manual_answer_file, expiration_time, last_modified_date_override } =
    env
  evaluate({ manual_answer_file, expiration_time, last_modified_date_override })
}
