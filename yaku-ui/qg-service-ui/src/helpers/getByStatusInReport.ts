// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type {
  CheckReport,
  RequirementReport,
  RunReportV1,
} from './convertRunResultToReport'

/**
 * returns a run report truncated to the item filtered by isCritical.
 * The first use case is to get the requirements that are different than NA or GREEN. So basically a filter of the allocations provided,.
 * @param chapters the items of a run report that contains the checks
 * @param isPassing a predicate to determine if checks are compliant
 */
export const getByStatusInReport = (
  chapters: RunReportV1['chapters'],
  isPassing: (check: CheckReport) => boolean,
) => {
  const filteredChapters = chapters.map(({ requirements, ...rest }) => ({
    ...rest,
    requirements: requirements.reduce((acc, r) => {
      const checks = r.checks.filter(isPassing)
      if (checks.length > 0) {
        acc.push({
          ...r,
          checks,
        })
      }
      return acc
    }, [] as RequirementReport[]),
  }))

  return filteredChapters.filter((c) => c.requirements.length > 0)
}

/**
 * Return a filter function depending of the provided filter operation
 *
 * @param filterOp the filter operation
 * @returns a predicate that tells if a check is compliant
 */
export const getStatusFilterFn = (filterOp: string) => {
  const FILTER_BY_RAW_STATE = ['YELLOW', 'GREEN', 'NA', 'UNANSWERED']
  if (FILTER_BY_RAW_STATE.includes(filterOp))
    return (check: CheckReport) => check.evaluation.status === filterOp
  if (filterOp === 'FAILED')
    return (check: CheckReport) =>
      ['RED', 'ERROR', 'FAILED'].includes(check.evaluation.status)
  if (filterOp === 'MANUAL')
    return (check: CheckReport) => check.type === 'Manual'
  else return () => true
}
