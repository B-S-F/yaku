// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ROUTE_NAMES } from '~/router'
import { ContentNavigationRouterLink } from '~/types/Release'
import {
  contentIdNormalizer,
  convertRunResultToReport,
  getByStatusInReport,
  getChapterBadge,
  getRequirementBadge,
  getStatusFilterFn,
} from '~/helpers'
import { useReportStore } from '~/store/useReportStore'
import { OverallResult } from '~/types'
import useFeatureFlags from '../useFeatureFlags'
import { useUrlContext } from '../useUrlContext'
import { storeContext } from '../api'
import { useReportStats } from '../useReportStats'

const useRunResultsReport = () => {
  const { useTaskManagement } = useFeatureFlags()

  const route = useRoute()
  const router = useRouter()
  const selected = computed(() => route.query.content as string)
  const runIdParam = computed(() =>
    route.name === ROUTE_NAMES.RUN_RESULTS
      ? Number(route.params.id)
      : undefined,
  )

  /* ================
   *   Data fetching
   * ================= */
  const reportStore = useReportStore(storeContext)
  // ---- Fetch the report ----
  const getReportInView = async (runId: number) => {
    const { ok, resource } = await reportStore.getReport(runId)
    if (ok) {
      const runReport = convertRunResultToReport(resource)
      if (!runReport) return // TODO: the run report format is not support yet
      report.value = runReport.report
      version.value = runReport.version
    } else {
      router.push({ name: 'NotFoundError', params: urlContext.value })
    }
  }

  watch(
    runIdParam,
    (newVal, oldVal) => {
      if (router.currentRoute.value.name !== 'RunResults') return
      if (newVal === oldVal) return
      if (newVal) getReportInView(newVal)
    },
    { immediate: true },
  )

  const report =
    ref<NonNullable<ReturnType<typeof convertRunResultToReport>>['report']>()
  const version = ref<'v0' | 'v1'>()
  const reportStats = computed(() =>
    report.value ? useReportStats({ report: report.value }) : undefined,
  )

  const chapters = computed(() => report.value?.chapters)
  const { urlContext } = useUrlContext()
  const filterBy = ref(route.query.filterBy as string | undefined)
  watch(filterBy, (newVal) => {
    router.replace({
      name: ROUTE_NAMES.RUN_RESULTS,
      query: { ...route.query, filterBy: newVal },
      params: {
        ...urlContext.value,
      },
    })
  })

  const currentChapters = computed(() =>
    filterBy.value
      ? getByStatusInReport(
          chapters.value ?? [],
          getStatusFilterFn(filterBy.value),
        )
      : chapters.value,
  )
  const areOpen = ref<string[]>([])

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

  const currentContent = computed(() => route.query.content as string)

  const contentNavItems = computed(
    () =>
      currentChapters.value?.map((chapter) => {
        return {
          id: chapter.id,
          name: chapter.title,
          to: { query: { content: contentIdNormalizer(chapter.id) } },
          color: chapter.status as OverallResult,
          requirements: chapter.requirements.map((r) => ({
            id: r.id,
            name: r.title,
            color: r.status as OverallResult,
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

  const oldComponentContentNav = computed(
    () =>
      currentChapters.value?.map((chapter) => {
        return {
          id: chapter.id,
          name: chapter.title,
          to: { query: { content: contentIdNormalizer(chapter.id) } },
          badge: getChapterBadge(chapter),
          subItems: chapter.requirements.map((r) => ({
            id: r.id,
            name: r.title,
            badge: getRequirementBadge(r),
            to: { query: { content: contentIdNormalizer(chapter.id, r.id) } },
          })),
        }
      }) ?? [],
  )

  return {
    areOpen,
    isSelected,
    toggleOpen,
    currentChapters,
    currentContent,
    contentNavItems,
    useTaskManagement,
    report,
    reportStats,
    filterBy,
    useNewComponent: !!useTaskManagement,
    oldComponentContentNav,
  }
}

export default useRunResultsReport
