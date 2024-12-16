// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { Badge, ReportResult, RunResultStatus } from '~/types'
import type {
  ChapterReport,
  CheckReport,
  RequirementReport,
  ResultReport,
} from './convertRunResultToReport'
import { iterateOnChecks } from '~/composables/useReportStats'
import { pluralize } from '~/utils'

const PRIORITY = {
  NONE: 0,
  WARNING: 1,
  FINDING: 2,
  ERROR: 3,
} as const

/**
 * -1 can be used for no priority.
 * 0 is the lowest priority.
 * Then the highest
 * It ignores other statuses that are not listed in the map.
 */
const STATUS_PRIORITY = new Map<RunResultStatus | undefined, number>([
  [undefined, PRIORITY.NONE],
  ['YELLOW', PRIORITY.WARNING],
  ['RED', PRIORITY.FINDING],
  ['ERROR', PRIORITY.ERROR],
  ['FAILED', PRIORITY.ERROR],
])

const getBasePrioInfo = () => ({
  status: undefined,
  priority: PRIORITY.NONE,
  checkCount: 0,
  findingCount: 0,
})

const isFinding = (r: ResultReport) => !r.fulfilled

type PrioInfo = {
  status: ReportResult['status'] | undefined
  priority: number
  checkCount: number
  findingCount: number
}
// les status les plus graves
const toWorstCheckStatusCount = (base: PrioInfo, check: CheckReport) => {
  const { status, results } = check.evaluation || {}
  const findings = results?.filter(isFinding)
  // update the finding checkCount
  base.findingCount += findings?.length ?? 0

  // adjust the priority, the related status and the worst requirement checkCount
  const priority =
    findings && findings.length > 0
      ? PRIORITY.FINDING
      : (STATUS_PRIORITY.get(status) ?? PRIORITY.NONE)
  if (priority === PRIORITY.NONE) return base
  if (base === undefined || priority > base.priority) {
    base = {
      ...base,
      status,
      priority,
      checkCount: 1,
    }
  } else if (priority === base.priority) {
    base.checkCount += 1
  }
  return base
}

export const getChapterBadge = (chapter: ChapterReport): Badge | undefined => {
  // .reduce style like but with a for loop because of the custom iterator
  let worstEvaluationInfo: PrioInfo = getBasePrioInfo()
  for (const check of iterateOnChecks([chapter])) {
    worstEvaluationInfo = toWorstCheckStatusCount(worstEvaluationInfo, check)
  }

  const { status, checkCount } = worstEvaluationInfo || {}
  if (checkCount === 0) return

  if (status === 'YELLOW') {
    return {
      color: 'Warning',
      label: `${checkCount} check${pluralize(checkCount)} with warnings`,
    }
  }
  if (status === 'RED') {
    return {
      color: 'LightError',
      label: `${checkCount} check${pluralize(checkCount)} failed`,
    }
  }
  if (status === 'ERROR' || status === 'FAILED') {
    return {
      color: 'Error',
      label: `${checkCount} check${pluralize(checkCount)} failed`,
    }
  }
}

const formatEvaluationInfoToBadge = (
  evaluationInfo: PrioInfo,
): Badge | undefined => {
  const { status, findingCount, checkCount } = evaluationInfo || {}
  const priority = STATUS_PRIORITY.get(status) ?? PRIORITY.NONE

  if (priority === PRIORITY.WARNING) {
    return {
      color: 'Warning',
      label: `${checkCount} warning${pluralize(checkCount)}`,
    }
  }

  if (priority === PRIORITY.FINDING) {
    return {
      color: 'LightError',
      label: `${findingCount} finding${pluralize(findingCount)}`,
    }
  }

  if (priority === PRIORITY.ERROR) {
    return {
      color: 'Error',
      label: `failed`,
    }
  }
}

export const getRequirementBadge = ({
  checks,
}: RequirementReport): Badge | undefined => {
  const worstEvaluationInfo: PrioInfo | undefined = checks.reduce(
    toWorstCheckStatusCount,
    getBasePrioInfo(),
  )
  if (worstEvaluationInfo && worstEvaluationInfo.checkCount > 0) {
    return formatEvaluationInfoToBadge(worstEvaluationInfo)
  }
}

export const getCheckBadge = (
  check: RequirementReport['checks'][number],
): Badge | undefined => {
  const evaluationInfo = toWorstCheckStatusCount(getBasePrioInfo(), check)

  const hasNoInfo = !evaluationInfo || evaluationInfo.checkCount === 0
  const isError = evaluationInfo.priority === PRIORITY.ERROR
  const hasNoFinding =
    evaluationInfo.priority === PRIORITY.FINDING &&
    evaluationInfo.findingCount === 0
  if (hasNoInfo || isError || hasNoFinding) return

  return formatEvaluationInfoToBadge(evaluationInfo)
}
