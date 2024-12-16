// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { storeToRefs } from 'pinia'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { OverrideColor } from '~/api'
import {
  ChapterReport,
  contentIdNormalizer,
  getChapterBadge,
  getCheckBadge,
  getRequirementBadge,
  getVuetifyRunPillFromOverallResult,
  RequirementReport,
} from '~/helpers'
import {
  aggregateOverride,
  getChecksStateSummary,
} from '~/helpers/getCheckStateSummary'
import useReleaseOverridesStore from '~/store/useReleaseOverridesStore'
import {
  ContentNavigationRouterLink,
  OverallResult,
  RunResultStatus,
  StatusPillDisplay,
} from '~/types'
import { Check } from '~/types/Release'
import { useReleaseFetcher } from '../fetcher/useReleaseDetailsFetcher'
import useFeatureFlags from '../useFeatureFlags'

const MANUAL_STATUS_PRIORITY = {
  ERROR: 5,
  FAILED: 4,
  RED: 3,
  YELLOW: 2,
  GREEN: 1,
}

const getChapterChecks = (chapter: ChapterReport, checks: Check[]) => {
  const chapterChecks = checks.filter((c) => c.chapterId === chapter.id)
  const hasOverride = chapterChecks.some((c) => c.status !== c.originalStatus)
  return { chapterChecks, hasOverride }
}

const getChapterStatus = (chapter: ChapterReport, checks: Check[]) => {
  const { chapterChecks, hasOverride } = getChapterChecks(chapter, checks)
  if (!hasOverride) return chapter.status
  return chapterChecks.reduce((worst: string | undefined, c) => {
    if (
      !worst ||
      MANUAL_STATUS_PRIORITY[c.status as OverrideColor] >
        MANUAL_STATUS_PRIORITY[worst as OverrideColor]
    ) {
      return c.status
    }
    return worst
  }, undefined)
}

const getRequirementStatus = (
  chapter: ChapterReport,
  requirement: RequirementReport,
  checks: Check[],
) => {
  const requirementChecks = checks.filter(
    (c) => c.requirementId === requirement.id && c.chapterId === chapter.id,
  )
  const hasOverride = requirementChecks.some(
    (c) => c.status !== c.originalStatus,
  )
  if (!hasOverride) return requirement.status
  return requirementChecks.reduce((worst: string | undefined, c) => {
    if (
      !worst ||
      MANUAL_STATUS_PRIORITY[c.status as OverrideColor] >
        MANUAL_STATUS_PRIORITY[worst as OverrideColor]
    ) {
      return c.status
    }
    return worst
  }, undefined)
}

const useReleaseDetailsRunReport = (releaseId: string | number) => {
  const currentCheck = ref<Check>()
  const route = useRoute()
  const areOpen = ref<string[]>([])

  const selected = computed(() => route.query.content as string)

  const isSelected = ({ to }: { to: ContentNavigationRouterLink }) =>
    to.query.content === selected.value

  const toggleOpen = (id: string) => {
    const isOpenAt = areOpen.value.findIndex((v) => v === id)
    if (isOpenAt === -1) {
      areOpen.value.push(id)
    } else {
      areOpen.value.splice(isOpenAt, 1)
    }
  }

  watch(currentCheck, (newCheck) => {
    if (newCheck && !areOpen.value.includes(newCheck.chapterId)) {
      toggleOpen(newCheck.chapterId)
    }
  })

  const { releaseRunReport: report, getReleaseRunReport } = useReleaseFetcher({
    id: releaseId,
  })
  const overrideStore = useReleaseOverridesStore()
  const releaseOverrides = storeToRefs(overrideStore)
  onMounted(async () => {
    if (releaseId) {
      await overrideStore.getReleaseOverrides(releaseId)
    }
  })
  const chapters = computed(() =>
    report.value?.chapters.map((c) => ({
      ...c,
      requirements: c.requirements.map((r) => ({
        ...r,
        checks: checks.value.filter(
          (ch) => ch.chapterId === c.id && ch.requirementId === r.id,
        ),
      })),
    })),
  )
  const checks = computed(() => {
    return (
      report.value?.chapters.flatMap((chapter) =>
        chapter.requirements.flatMap((requirement) =>
          requirement.checks.map((check) => {
            const override = releaseOverrides.overrides.value.find(
              (override) =>
                override.reference.chapter === chapter.id &&
                override.reference.requirement === requirement.id &&
                override.reference.check === check.id,
            )
            return {
              ...check,
              pageId: chapter.id + requirement.id + check.id,
              requirementId: requirement.id,
              chapterId: chapter.id,
              originalStatus: check.status,
              status: (override
                ? override.manualColor
                : check.status) as RunResultStatus,
              evaluation: {
                ...check.evaluation,
                status: override
                  ? (override.manualColor as RunResultStatus)
                  : check.evaluation.status,
              },
            }
          }),
        ),
      ) || []
    )
  })
  const checksNavContent = computed(
    () =>
      chapters.value?.map((chapter) => {
        return {
          id: chapter.id,
          name: chapter.title,
          to: { query: { content: contentIdNormalizer(chapter.id) } },
          badge: getChapterBadge(chapter),
          requirements: chapter.requirements.map((r) => ({
            id: r.id,
            name: r.title,
            badge: getRequirementBadge(r),
            to: { query: { content: contentIdNormalizer(chapter.id, r.id) } },
            checks: r.checks.map((c) => ({
              pageId: chapter.id + r.id + c.id,
              id: c.id,
              name: c.title,
              badge: getCheckBadge(c),
              to: {
                query: { content: contentIdNormalizer(chapter.id, r.id, c.id) },
              },
            })),
          })),
        }
      }) ?? [],
  )

  const vuetifyOverallResultPill = computed<StatusPillDisplay>(() => {
    const checksSummary = getChecksStateSummary(checks.value)
    const status = aggregateOverride(checksSummary)
    return getVuetifyRunPillFromOverallResult(status)
  })

  const contentNavItems = computed(
    () =>
      chapters.value?.map((chapter) => {
        return {
          id: chapter.id,
          name: chapter.title,
          to: { query: { content: contentIdNormalizer(chapter.id) } },
          // color: chapter.status as OverallResult,
          color: getChapterStatus(chapter, checks.value),
          hasOverride: getChapterChecks(chapter, checks.value).hasOverride,
          requirements: chapter.requirements.map((r) => ({
            id: r.id,
            name: r.title,
            // color: r.status as OverallResult,
            color: getRequirementStatus(chapter, r, checks.value),
            to: { query: { content: contentIdNormalizer(chapter.id, r.id) } },
            checks: r.checks.map((c) => ({
              id: c.id,
              name: c.title,
              color: c.status as OverallResult,
              to: {
                query: { content: contentIdNormalizer(chapter.id, r.id, c.id) },
              },
            })),
          })),
        }
      }) ?? [],
  )

  const { useTaskManagement } = useFeatureFlags()

  return {
    report,
    chapters,
    checksNavContent,
    checks,
    getReleaseRunReport,
    vuetifyOverallResultPill,
    contentNavItems,
    currentCheck,
    isSelected,
    toggleOpen,
    useNewComponent: !!useTaskManagement,
    areOpen,
  }
}

export default useReleaseDetailsRunReport
