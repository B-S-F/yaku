// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { markRaw } from 'vue'
import type {
  CheckResult,
  Requirement,
  ResultType,
  RunResult,
  RunResultV0,
  RunResultV1,
} from '~/types/RunResult'
import { ManualStatus } from '~/types/RunResult/Common'
import type { ManualEvaluation } from '~/types'

export type RunReportV1 = ReturnType<typeof convertFromReportV1>
export type ChapterReport = RunReportV1['chapters'][number]
export type RequirementReport = ChapterReport['requirements'][number]
export type CheckReport = RequirementReport['checks'][number]
export type EvaluationReport = CheckReport['evaluation']
export type ResultReport = NonNullable<EvaluationReport['results']>[number]

export const manualStatusToEvaluation = (
  r: Requirement,
): ManualEvaluation | undefined =>
  r.manualStatus && r.reason
    ? {
        status: r.status as ManualStatus,
        reason: r.reason,
      }
    : undefined

export const getManualEvaluationObject = (
  c: CheckResult,
): ManualEvaluation | undefined =>
  c.type === 'Manual'
    ? {
        status: c.evaluation.status as ManualStatus,
        reason: c.evaluation.reason ?? '',
      }
    : undefined

export const convertFromReportV0 = (result: RunResultV0): RunReportV1 => {
  const { header, overallStatus, allocations } = result

  const sections = Object.entries(allocations).reduce(
    (acc, [id, allocation]) => {
      const section = {
        id,
        title: allocation.title,
        status: allocation?.status,
        requirements: Object.entries(allocation.requirements).reduce(
          (acc, [idCheck, requirement]) => {
            const r: RequirementReport = {
              id: idCheck,
              title: requirement.title,
              status: requirement.status,
              text: requirement.text,
              checks: Object.values(requirement.checks).flatMap((check) => {
                return check.reports.flatMap((report) => {
                  return report.componentResults.map(
                    ({ component, status }) => ({
                      id: check.id,
                      title: `${component.id} ${component.version}`,
                      type: requirement.manualStatus
                        ? 'Manual'
                        : ('Automation' as ResultType),
                      name: check.title,
                      status,
                      evaluation: {
                        status,
                      },
                      // no manualEvaluation can be set on the componentResult or check.
                    }),
                  )
                })
              }),
            }
            // push a default check if none is provided
            if (r.checks.length === 0)
              r.checks.push({
                id: '1',
                title: 'Default check from requirement',
                type: requirement.manualStatus
                  ? 'Manual'
                  : ('Automation' as ResultType),
                status: requirement.manualStatus ?? requirement.status,
                evaluation: {
                  status: requirement.manualStatus ?? requirement.status,
                },
              })

            acc.push(r)
            return acc
          },
          [] as RequirementReport[],
        ),
      }
      acc.push(section)
      return acc
    },
    [] as RunReportV1['chapters'],
  )

  return {
    header: {
      name: header.name,
      date: header.date,
      version: header.version,
    },
    metadata: {
      version: 'v1',
    },
    overallStatus,
    chapters: sections,
  }
}

const convertFromReportV1 = (result: RunResultV1) => {
  const { chapters, header, metadata, overallStatus } = result

  markRaw(result)

  const flatChapters = Object.entries(chapters).map(([id, chapter]) => {
    return {
      id,
      title: chapter.title,
      status: chapter.status,
      // flatten the objects to arrays
      requirements:
        Object.entries(chapter.requirements).flatMap(
          ([requirementId, requirement]) => {
            return {
              id: requirementId,
              status: requirement.status,
              title: requirement.title,
              text: requirement.text as string | undefined,
              // create one entry for each autopilot in check in the results
              checks: requirement.checks
                ? Object.entries(requirement.checks).flatMap(
                    ([checkId, check]) => {
                      return {
                        id: checkId,
                        ...check,
                      }
                    },
                  )
                : [],
            }
          },
        ) ?? [],
    }
  })
  return {
    metadata,
    header: {
      name: header.name,
      date: header.date,
      version: header.version,
    },
    chapters: flatChapters,
    overallStatus,
  }
}

export const convertRunResultToReport = (result: RunResult) => {
  if (!result.metadata) {
    console.warn(
      'The report version version 0 is deprecated. Please upgrade your configuration to v1.',
    )
    // return { report: converterToReport.v0(result), version: 'v0' as const }
    return { report: convertFromReportV0(result), version: 'v0' as const }
  } else if (result.metadata.version === 'v1') {
    return { report: convertFromReportV1(result), version: 'v1' as const }
  } else {
    console.error(
      `The report version ${result.metadata.version} is not supported.`,
    )
  }
}
