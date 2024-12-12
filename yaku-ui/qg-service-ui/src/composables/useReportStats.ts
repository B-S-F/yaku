// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { MaybeRef } from '@vueuse/core'
import type { RunResultStatus } from '~/types'
import type { RunReportV1 } from '~/helpers'
import { unref } from 'vue'
import { getLargestRemainder } from '~/utils/getLargestRemainder'

type UseReportStatsReturn = {
  results: {
    GREEN: number
    YELLOW: number
    RED: number
    NA: number
    UNANSWERED: number
  }
  answered: {
    automatic: number
    manual: number
  }
}

export type UseReportStatsParams = {
  report: MaybeRef<RunReportV1>
}

export function* iterateOnChecks(chapters: RunReportV1['chapters']) {
  for (const { requirements } of chapters) {
    for (const r of requirements) {
      for (const c of r.checks) {
        // we do not validate down to the result to stay compatible with RunResultsV0 stats for now
        yield c
      }
    }
  }
}

const getValue = (m: Map<RunResultStatus, number>, k: RunResultStatus) =>
  m.get(k) ?? 0

const getAnsweredPourcentage = (
  report: RunReportV1,
): UseReportStatsReturn['answered'] => {
  let total = 0
  let automaticCount = 0,
    manualCount = 0

  for (const item of iterateOnChecks(report.chapters)) {
    total += 1
    if (item.type === 'Manual') {
      manualCount += 1
    } else if (item.type === 'Automation') {
      automaticCount += 1
    }
  }

  const raw = {
    automatic: (automaticCount / total) * 100,
    manual: (manualCount / total) * 100,
  }
  const [automatic, manual] = getLargestRemainder(
    [raw.automatic, raw.manual],
    raw.automatic + raw.manual,
  )

  return {
    automatic,
    manual,
  }
}

const getResultsPourcentage = (
  report: RunReportV1,
): UseReportStatsReturn['results'] => {
  let total = 0
  const acc = new Map<RunResultStatus, number>()

  for (const item of iterateOnChecks(report.chapters)) {
    acc.set(
      item.status as RunResultStatus,
      (acc.get(item.status as RunResultStatus) ?? 0) + 1,
    )
    total += 1
  }

  const greenAmount = getValue(acc, 'GREEN')
  const yellowAmount = getValue(acc, 'YELLOW')
  const redAmount =
    getValue(acc, 'RED') + getValue(acc, 'FAILED') + getValue(acc, 'ERROR')
  const naAmount = getValue(acc, 'NA')
  const unansweredAmount =
    getValue(acc, 'UNANSWERED') + getValue(acc, 'SKIPPED')

  const rawGreen = (greenAmount / total) * 100
  const rawYellow = (yellowAmount / total) * 100
  const rawRed = (redAmount / total) * 100
  const rawNa = (naAmount / total) * 100
  const rawUnanswered = (unansweredAmount / total) * 100

  const [GREEN, YELLOW, RED, NA, UNANSWERED] = getLargestRemainder(
    [rawGreen, rawYellow, rawRed, rawNa, rawUnanswered],
    100,
  )

  return {
    GREEN,
    YELLOW,
    RED,
    NA,
    UNANSWERED,
  }
}

export const useReportStats = ({
  report,
}: UseReportStatsParams): UseReportStatsReturn => {
  // 2 passes on the object seems fine for now
  const answered = getAnsweredPourcentage(unref(report))
  const results = getResultsPourcentage(unref(report))

  return {
    results,
    answered,
  }
}
