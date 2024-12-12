// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { storeContext, useApiCore, useApiNetworkError } from '~/composables/api'
import {
  ReleaseReport,
  ReleaseReportApproverStatus,
  ReleaseReportCheck,
} from '~/types/ReleaseReport'
import { useReleaseStore } from './useReleaseStore'
import { useConfigStore } from './useConfigStore'
import { GetRun, ReleaseOverride } from '~/api'
import {
  getChapterBadge,
  getCheckBadge,
  getRequirementBadge,
  provideRequestError,
} from '~/helpers'
import { useReleaseFetcher } from '~/composables/fetcher/useReleaseDetailsFetcher'
import {
  ReleaseApprovalState,
  ReleaseHistoryEventObject,
  ReleaseHistoryItem,
} from '~/types/Release'
import { useApiReleases } from '~/composables/api/useApiReleases'
import useReleaseDetailsRunReport from '~/composables/releaseDetails/useReleaseDetailsRunReport'
import useConfigFindings from '~/composables/useConfigFindings'
import { Finding, RunResultStatus } from '~/types'
import { OperationResult } from './apiIntegration'
import {
  aggregateOverride,
  getChecksStateSummary,
  getChecksStateSummaryDistribution,
} from '~/helpers/getCheckStateSummary'

type generateReleaseReportParams = {
  releaseId: number
  configId: number
  runId: number
}

const useReleaseReportStore = () => {
  const report = ref<ReleaseReport>({
    checksSummary: {
      GREEN: 0,
      YELLOW: 0,
      RED: 0,
      NA: 0,
    },
    checksAnswersDistribution: {
      automatic: 0,
      manual: 0,
      unanswered: 0,
    },
  })
  const isGeneratingReport = ref<boolean>(false)
  const reportError = ref<string>()

  const releaseStore = useReleaseStore(storeContext)
  const configStore = useConfigStore(storeContext)
  const apiCore = useApiCore()
  const {
    getReleaseHistory,
    getReleaseHistoryNext,
    getReleaseOverride,
    getReleaseComments,
  } = useApiReleases()

  const clearReport = () => {
    report.value = {
      checksSummary: {
        GREEN: 0,
        YELLOW: 0,
        RED: 0,
        NA: 0,
      },
      checksAnswersDistribution: {
        automatic: 0,
        manual: 0,
        unanswered: 0,
      },
    }
  }

  const getReleaseMeta = async (releaseId: number) => {
    const getRelease = await releaseStore.getOrFetch(releaseId)
    if (getRelease.ok) {
      const { name, plannedDate } = getRelease.resource
      report.value.releaseId = releaseId
      report.value.releaseMeta = { name, date: plannedDate }
    } else if (getRelease.error) {
      throw new Error(getRelease.error.msg)
    }
  }

  const getConfigMeta = async (configId: number) => {
    const getConfig = await configStore.getOrFetch(configId)

    if (getConfig.ok) {
      const { name, creationTime } = getConfig.resource

      report.value.configMeta = { name, date: creationTime }
    } else if (getConfig.error) {
      throw new Error(getConfig.error.msg)
    }
  }

  const getRunReportMeta = async (runId: number) => {
    const getRun = await apiCore.getRun({ runId })
    if (getRun.ok) {
      const run = (await getRun.json()) as GetRun
      const { id, completionTime = '', overallResult } = run
      report.value.runMeta = { id, date: completionTime }
      report.value.overallRunResult = overallResult
    } else {
      const error = await provideRequestError(getRun)
      throw new Error(error)
    }
  }

  const fetchAllApprovalComments = async (releaseId: number) => {
    let next: string | undefined = ''
    const items: ReleaseHistoryItem[] = []

    while (next !== undefined) {
      const fetcher = async () =>
        next && next !== ''
          ? await getReleaseHistoryNext(next)
          : await getReleaseHistory({
              releaseId,
              filter: 'event',
              sortOrder: 'DESC',
              items: '100',
            })

      const getHistory = await fetcher()

      if (getHistory.ok) {
        const rjson = await getHistory.json()
        if (Array.isArray(rjson?.data)) {
          if (rjson?.data.length) {
            items.push(...rjson.data)
            next = rjson?.links?.next ? rjson?.links?.next : undefined
          } else {
            next = undefined
          }
        } else {
          break
        }
      } else {
        const error = await provideRequestError(getHistory)
        throw new Error(error)
      }
    }

    return items.filter((i) =>
      ['reset', 'approved'].includes(
        (i.data as ReleaseHistoryEventObject).action,
      ),
    )
  }

  const getReleaseApprovers = async (releaseId: number) => {
    const { releaseApprovers, fetchAllApproversState } = useReleaseFetcher({
      id: releaseId,
    })
    await fetchAllApproversState()
    const approversAndComments: ReleaseReportApproverStatus[] = []
    if (releaseApprovers.value.length) {
      const comments = await fetchAllApprovalComments(releaseId)
      releaseApprovers.value.forEach((a) => {
        const comment = comments.find(
          (c) => (c.data as ReleaseHistoryEventObject)?.actor?.id === a.user.id,
        )
        approversAndComments.push({
          approver: a.user,
          status: a.state as ReleaseApprovalState,
          comment: comment
            ? (comment?.data as ReleaseHistoryEventObject).comment?.content
            : undefined,
        })
      })
      if (approversAndComments.length) {
        report.value.approvers = approversAndComments
      }
    }
  }

  const getChecksOverrides = async (releaseId: number) => {
    const getOverrides = await getReleaseOverride({ releaseId })
    if (getOverrides.ok) {
      return (await getOverrides.json()) as ReleaseOverride[]
    } else {
      const error = await provideRequestError(getOverrides)
      throw new Error(error)
    }
  }

  const getReportComments = async (releaseId: number) => {
    report.value.comments = []
    let page: number | undefined = 1

    while (page !== undefined) {
      const getComments = (await getReleaseComments({
        releaseId,
        items: '100',
        page: String(page),
      })) as Response
      if (getComments.ok) {
        const rjson = await getComments.json()
        if (!rjson?.data || !rjson?.data?.length) {
          page = undefined
        } else {
          report.value.comments.push(...rjson.data)
          page =
            rjson?.pagination?.totalCount > rjson.data.length
              ? page + 1
              : undefined
        }
      } else {
        const error = await provideRequestError(getComments)
        throw new Error(error)
      }
    }
  }

  const getChaptersData = async (releaseId: number, configId: number) => {
    const reportChecks: ReleaseReportCheck[] = []
    const { chapters, checks, getReleaseRunReport } =
      useReleaseDetailsRunReport(releaseId)
    const { findings, fetchAllFindings } = useConfigFindings()
    await getReleaseRunReport()
    const overrides = await getChecksOverrides(releaseId)
    await fetchAllFindings(String(configId), false)

    checks.value.forEach((check) => {
      const checkFindings: Finding[] = []
      const override = overrides.find(
        (override) =>
          override.reference.chapter === check.chapterId &&
          override.reference.requirement === check.requirementId &&
          override.reference.check === check.id,
      )
      check?.evaluation?.results?.forEach((result) => {
        const findingsPerResult = (findings.value || []).filter(
          (finding) =>
            finding.chapter === check.chapterId &&
            finding.requirement == check.requirementId &&
            finding.check === check.id &&
            finding.criterion === result.criterion &&
            finding.justification === result.justification,
        )

        checkFindings.push(...findingsPerResult)
      })
      const checkComments = (report?.value?.comments || []).filter(
        (comment) => {
          const {
            type,
            chapter,
            requirement,
            check: checkId,
          } = comment.reference
          return (
            type === 'check' &&
            chapter === check.chapterId &&
            requirement === check.requirementId &&
            checkId === check.id
          )
        },
      )
      reportChecks.push({
        ...check,
        status: (override?.manualColor
          ? override.manualColor
          : check.status) as RunResultStatus,
        badge: getCheckBadge(check),
        override,
        findings: checkFindings,
        comments: checkComments,
      })
    })

    const reportChapters = chapters.value?.map((chapter) => {
      return {
        id: chapter.id,
        title: chapter.title,
        badge: getChapterBadge(chapter),
        requirements: chapter.requirements.map((requirement) => ({
          id: requirement.id,
          title: requirement.title,
          badge: getRequirementBadge(requirement),
          checks: reportChecks.filter(
            (check) =>
              check.chapterId === chapter.id &&
              check.requirementId === requirement.id,
          ),
        })),
      }
    })

    report.value.chapters = reportChapters
    report.value.checksSummary = getChecksStateSummary(reportChecks)
    report.value.checksAnswersDistribution =
      getChecksStateSummaryDistribution(reportChecks)
    report.value.overallRunResult = aggregateOverride(
      report.value.checksSummary,
    )
  }

  const generateReport = async ({
    releaseId,
    configId,
    runId,
  }: generateReleaseReportParams) => {
    try {
      isGeneratingReport.value = true
      reportError.value = undefined // Reset error
      clearReport()
      await Promise.all([
        getReleaseMeta(releaseId),
        getConfigMeta(configId),
        getRunReportMeta(runId),
        getReleaseApprovers(releaseId),
        getReportComments(releaseId),
        getChaptersData(releaseId, configId),
      ])
    } catch (e) {
      console.error('Error generating release report', { e })
      if (e instanceof Error && e?.message) {
        reportError.value = e?.message
      } else {
        reportError.value = useApiNetworkError()
      }
    } finally {
      isGeneratingReport.value = false
    }
  }

  const getReport = async (
    releaseId: number,
  ): Promise<OperationResult<ReleaseReport>> => {
    if (report.value.releaseId === releaseId) {
      return { ok: true, resource: report.value }
    } else {
      throw new Error('not found')
    }
  }

  return {
    report,
    isGeneratingReport,
    generateReport,
    getReport,
  }
}

export default () =>
  defineStore('release-report-store', useReleaseReportStore, {
    persist: {
      storage: localStorage,
    },
  })()
