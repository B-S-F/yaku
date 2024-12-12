// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { Run } from '~/types'
import type { SingleCheck } from '~/api'
import { DOUBLE_HYPHEN } from '~/config/app'

/**
 * Filter out the logs to get only the ones of a check
 * @param report the logs
 * @param chapter the chapter ID the check is into
 * @param requirement the requirement ID the check is into
 * @check check the ID of the check
 * @returns the filtered logs only matching the range of a check or the all logs if it can not find them
 */
export const getCheckLogs = (
  logs: string[],
  { chapter, requirement, check }: SingleCheck,
): string[] => {
  const startLine = `info\\t[[ CHAPTER: ${chapter} REQUIREMENT: ${requirement} CHECK: ${check} ]]`

  const NEXT_CHECK_PATTERN = new RegExp(
    /info\\t[[ CHAPTER: \d+ REQUIREMENT: \d+ CHECK: \d+ ]]/,
  )
  const LAST_CHECK_LINE = 'info\\tcreating result'

  const isStartingAt = logs.findIndex((line) => line === startLine)
  if (isStartingAt === -1) return logs
  const checkLogsLength = logs
    .slice(isStartingAt)
    ?.findIndex(
      (line) => line.match(NEXT_CHECK_PATTERN) || line === LAST_CHECK_LINE,
    )
  return checkLogsLength === -1
    ? logs
    : logs.slice(isStartingAt, isStartingAt + checkLogsLength)
}

export const isRunRunning = (run: Run) =>
  run.status === 'pending' || run.status === 'running'
export const areRunLogsAvailable = (run: Run) =>
  run.status === 'completed' || run.status === 'failed'
export const areRunResultsAvailable = (run: Run) => run.status === 'completed'

/**
 * Formats route query params
 * @param chapter string
 * @param requirement string
 * @param check string
 * @returns string
 */
export const contentIdNormalizer = (
  chapter: string,
  requirement?: string,
  check?: string,
) =>
  `chapter${DOUBLE_HYPHEN}${chapter}${requirement ? DOUBLE_HYPHEN + 'requirement' + DOUBLE_HYPHEN + requirement : ''}${check ? DOUBLE_HYPHEN + 'check' + DOUBLE_HYPHEN + check : ''}`
