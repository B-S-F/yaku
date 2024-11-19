// SPDX-FileCopyrightText: 2022 2023 by grow platform GmbH
// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { AppError, AppOutput, GetLogger } from '@B-S-F/autopilot-utils'
import { getExpDate } from '../utils/getExpDate.js'
import { FileData, readContentAndMtime } from '../utils/readContentAndMtime.js'
import { validateExpDate } from '../utils/validateExpDate.js'

class ConfigurationError extends AppError {
  constructor(message: string) {
    super(message)
    this.name = 'ConfigurationError'
  }

  Reason(): string {
    return super.Reason()
  }
}

export interface ManualAnswerArgs {
  manual_answer_file: string
  expiration_time: string
  last_modified_date_override?: string
}

export interface ManualAnswer {
  modificationDate: Date
  answer: string
}

export const getManualAnswer = (parsedInput: FileData) => {
  const manualAnswer = parsedInput.content
  if (manualAnswer === undefined) {
    throw new Error('No manual answer found')
  }
  return manualAnswer
}

export const readManualAnswer = async (
  filePath: string,
): Promise<ManualAnswer> => {
  const fileData = await readContentAndMtime(filePath)
  const answer = getManualAnswer(fileData)
  return { answer, modificationDate: new Date(fileData.mtime) }
}

export const evaluate = async ({
  manual_answer_file,
  expiration_time,
  last_modified_date_override,
}: ManualAnswerArgs) => {
  const output = new AppOutput()
  const logger = GetLogger()
  const manualAnswer = await readManualAnswer(manual_answer_file)
  logger.debug(`Evaluating manual answer: ${manualAnswer.answer}`)
  if (last_modified_date_override) {
    manualAnswer.modificationDate = new Date(last_modified_date_override)
    if (manualAnswer.modificationDate.toString() === 'Invalid Date') {
      throw new ConfigurationError(
        `Invalid date format for last_modified_date_override: ${last_modified_date_override}`,
      )
    }
  }
  const expDate = getExpDate(manualAnswer.modificationDate, expiration_time)
  logger.debug(
    `LastModified: ${
      manualAnswer.modificationDate
    },Expiration date: ${expDate.toISOString()}`,
  )
  const result = validateExpDate(expDate)
  logger.debug(`Status: ${result}`)
  output.setStatus(result)
  switch (result) {
    case 'RED':
      output.setReason(
        `${
          manualAnswer.answer
        }\n**The manual answer is expired at ${expDate.toISOString()}**`,
      )
      break
    case 'YELLOW':
      output.setReason(
        `${
          manualAnswer.answer
        }\n**The manual answer will expire at ${expDate.toISOString()}**`,
      )
      break
    case 'GREEN':
      output.setReason(
        `${
          manualAnswer.answer
        }\n**The manual answer is valid until ${expDate.toISOString()}**`,
      )
      break
    default:
      throw new Error(`A unexpected status was calculated: ${result}`)
  }
  output.write()
  return
}
