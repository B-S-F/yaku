// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { RunResultStatus } from '~/types'
import { checksOverallStatus } from '~/types/ReleaseReport'
import { ResultType } from '~/types/RunResult'

export const getChecksStateSummary = (
  checks: { status: RunResultStatus | string }[],
) => {
  const results = { GREEN: 0, RED: 0, YELLOW: 0, NA: 0 }
  const checkStatus = ['GREEN', 'RED', 'YELLOW', 'NA']
  const replaceWithRed = ['FAILED', 'ERROR']
  if (!checks.length) return results
  checks.forEach((check) => {
    if (check.status !== 'UNANSWERED') {
      if (replaceWithRed.includes(check.status)) {
        results['RED'] += 1
      } else if (!checkStatus.includes(check.status)) {
        results['NA'] += 1
      } else {
        results[check.status as 'GREEN' | 'RED' | 'YELLOW' | 'NA'] += 1
      }
    }
  })
  const total = Object.values(results).reduce((a, b) => a + b, 0)

  if (total === 0) return results
  return {
    GREEN: Math.round((results['GREEN'] / total) * 100),
    RED: Math.round((results['RED'] / total) * 100),
    YELLOW: Math.round((results['YELLOW'] / total) * 100),
    NA: Math.round((results['NA'] / total) * 100),
  }
}

export const aggregateOverride = (result: checksOverallStatus) => {
  const { GREEN, RED, YELLOW, NA } = result
  if (RED) return 'RED'
  else if (YELLOW) return 'YELLOW'
  else if (GREEN) return 'GREEN'
  else if (NA) return 'NA'
  return 'UNANSWERED'
}

export const getChecksStateSummaryDistribution = (
  checks: { type: ResultType; status: RunResultStatus | string }[],
) => {
  const results = { unanswered: 0, manual: 0, automatic: 0 }
  if (!checks.length) return results
  checks.forEach((check) => {
    if (check.status === 'UNANSWERED') results['unanswered'] += 1
    else if (check.type === 'Automation') results['automatic'] += 1
    else if (check.type === 'Manual') results['manual'] += 1
  })
  const total = Object.values(results).reduce((a, b) => a + b, 0)
  if (total === 0) return results
  return {
    unanswered: Math.round((results['unanswered'] / total) * 100),
    automatic: Math.round((results['automatic'] / total) * 100),
    manual: Math.round((results['manual'] / total) * 100),
  }
}
