<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <main class="release-details">
    <div class="onboarding-element-without-focus top-50" data-onboarding="history" />
    <VuetifyToolbar class="release-details__toolbar" :class="{ 'sidebar-open': isSidebarOpen }"
      data-onboarding="release-details-toolbar">
      <VuetifyBackLink :to="backLink.to" />
      <!-- ReleaseChecksNavigator Responsive-->
      <div class="-from-md">
        <FrogPopover attached arrowPlacementClass="-top-left" :show="showChecksNavigator" style="--y-shift: 0.5rem"
          pophover-class="checks-navigator-popover" :data-onboarding="!breakpoints.from1210 ? 'quick-navigation' : ''">
          <FrogPopover v-bind="TOOLTIP_CONFIG">
            <template #content>
              Open checks
            </template>
            <FrogButton secondary :icon="showChecksNavigator ? 'mdi-close' : 'document'" :disabled="!releaseHasResults"
              @click="showChecksNavigator = !showChecksNavigator" />
          </FrogPopover>
          <template v-if="showChecksNavigator" #content>
            <div ref="releaseChecksNavigatorRef" class="checks-navigator-panel">
              <VuetifyRunReportNav v-if="useNewComponent" :chapters="contentNavItems">
                <template #chapter="chapter">
                  <VuetifyRunReportNavChapter :chapter="chapter" :isOpen="areOpen.includes(chapter.id)"
                    :manual-status="chapter.hasOverride" @toggleChapter="toggleOpen($event)">
                    <template #task>
                      <VuetifyTaskControl v-if="release" :release-id="release.id" :reference="{
                        chapter: chapter.id,
                        requirement: null,
                        check: null,
                      }" />
                    </template>
                    <template #requirement="requirement">
                      <VuetifyRunReportNavRequirement :requirement="requirement">
                        <template #task>
                          <VuetifyTaskControl v-if="release" :release-id="release.id" :reference="{
                            chapter: chapter.id,
                            requirement: requirement.id,
                            check: null,
                          }" />
                        </template>
                        <template #check="check">
                          <VuetifyRunReportNavCheck :check="check" />
                        </template>
                      </VuetifyRunReportNavRequirement>
                    </template>
                  </VuetifyRunReportNavChapter>
                </template>
              </VuetifyRunReportNav>
              <VuetifyReleaseChecksNavigator v-else semantic-header heading-tag="h2" heading-label="Chapters"
                :selected="queryParamsContent" :contentItems="checksNavContent"
                @select-check="(check) => handleCheckChange(check)" />
            </div>
          </template>
        </FrogPopover>
      </div>
      <div class="release-details__name-wrapper toolbar-gap">
        <VuetifyStatusPill rounded v-bind="vuetifyOverallResultPill" :color="vuetifyOverallResultPill.color"
          :tooltip="vuetifyOverallResultPill.tooltip" :label="undefined">
          <template #icon>
            <FrogIcon v-if="vuetifyOverallResultPill.icon" :icon="vuetifyOverallResultPill.icon" />
          </template>
        </VuetifyStatusPill>
        <VuetifyStatusPill v-if="release?.closed" rounded v-bind="closedReleasePill" :color="closedReleasePill.color"
          :tooltip="closedReleasePill.tooltip" :label="undefined">
          <template #icon>
            <FrogIcon v-if="closedReleasePill.icon" :icon="closedReleasePill.icon" />
          </template>
        </VuetifyStatusPill>
        <h1 class="-size-l name" :title="release?.name ?? 'Release'" :style="{
          '--mw': isSidebarOpen && !breakpoints.from640 ? `50px` : '',
        }">
          {{ release?.name ?? "Release" }}
        </h1>
        <FrogPopover v-if="!release?.closed" attached arrowPlacementClass="-top-left" :show="showEditReleasePopover"
          style="--y-shift: 0.5rem" pophover-class="edit-release-dialog" closeable>
          <FrogPopover v-bind="TOOLTIP_CONFIG">
            <template #content> Edit release </template>
            <FrogButton tertiary icon="mdi-pencil-outline" @click="showEditReleasePopover = true" />
          </FrogPopover>
          <template #headline>
            <h5 class="-size-m">Edit</h5>
          </template>
          <template #content>
            <VuetifyEditReleaseMetadata v-if="release && showEditReleasePopover" class="edit-config" :release="release"
              @confirm="handleEditReleaseMetaData.confirm" @close="handleEditReleaseMetaData.close" />
          </template>
        </FrogPopover>
      </div>
      <div class="toolbar-gap">
        <VuetifyStatusPill rounded v-bind="getVuetifyReleaseStatusPillInfo(releaseStatus)"
          :color="getVuetifyReleaseStatusPillInfo(releaseStatus).color"
          :tooltip="getVuetifyReleaseStatusPillInfo(releaseStatus).tooltip" :label="undefined">
          <template #icon>
            <FrogIcon v-if="!getVuetifyReleaseStatusPillInfo(releaseStatus).iconComponent"
              :icon="getVuetifyReleaseStatusPillInfo(releaseStatus).icon ?? ''" />
            <component :is="getVuetifyReleaseStatusPillInfo(releaseStatus).iconComponent" v-else />
          </template>
        </VuetifyStatusPill>
        <h5 class="release-status-label">
          {{ releaseStatus }}
        </h5>
      </div>
      <div v-if="isSidebarOpen ? breakpoints.from820 : breakpoints.from710" class="toolbar-gap">
        <FrogPopover v-if="isSidebarOpen ? breakpoints.from820 : breakpoints.from710" v-bind="TOOLTIP_CONFIG"
          :deactivate="breakpoints.from1260">
          <template #content>
            {{ manageApprovalLabel }}
          </template>
          <FrogButton secondary class="manage-approval-btn" icon="mdi-check-circle-outline" @click="showApprovalDialog = true">
            {{ manageApprovalLabel }}
            <template #right-content>
              <VuetifyApprover :approvers="releaseApprovers" />
            </template>
          </FrogButton>
        </FrogPopover>
      </div>
      <div v-if="isSidebarOpen ? breakpoints.from870 : breakpoints.from750" class="toolbar-gap actions">
        <FrogPopover v-if="isSidebarOpen ? breakpoints.from870 : breakpoints.from750" v-bind="TOOLTIP_CONFIG"
          :deactivate="breakpoints.from1260">
          <template #content>
            {{ generateReleaseReport.label }}
          </template>
          <FrogButton secondary :class="generateReleaseReport.class" :icon="generateReleaseReport.icon"
            :disabled="!releaseHasResults" @click="handleGenerateReport">
            {{ generateReleaseReport.label }}
          </FrogButton>
        </FrogPopover>
        <FrogPopover v-if="!release?.closed && breakpoints.from920" v-bind="TOOLTIP_CONFIG"
          :deactivate="breakpoints.from1440">
          <template #content> Share release </template>
          <FrogButton tertiary icon="mdi-share-variant-outline" disabled> Share </FrogButton>
        </FrogPopover>
        <FrogPopover v-if="!release?.closed && breakpoints.from960" v-bind="TOOLTIP_CONFIG"
          :deactivate="breakpoints.from1440">
          <template #content> Close release </template>
          <FrogButton tertiary icon="mdi-archive-outline" :disabled="release && release.closed"
            @click="showCloseReleaseDialog = true">
            Close
          </FrogButton>
        </FrogPopover>
        <FrogPopover v-if="!release?.closed && useReleaseEmails && breakpoints.from1020" v-bind="TOOLTIP_CONFIG"
          :deactivate="breakpoints.from1440">
          <template #content>
            {{ hasSubscribed ? "Unsubscribe" : "Subscribe" }}
          </template>
          <FrogButton tertiary :icon="hasSubscribed ? 'mdi-bell-off-outline' : 'mdi-bell-outline'"
            @click="handleSubscribeToRelease">
            {{ hasSubscribed ? "Unsubscribe" : "Subscribe" }}
          </FrogButton>
        </FrogPopover>
      </div>

      <div class="context-menu-container" :class="{ 'sidebar-open': isSidebarOpen }">
        <VuetifyInlineOrContext>
          <template #secondary-actions>
            <FrogMenuItem v-if="isSidebarOpen ? !breakpoints.from820 : !breakpoints.from710"
              :label="manageApprovalLabel" iconName="checkmark-frame" @click="showApprovalDialog = true" />
            <FrogMenuItem v-if="isSidebarOpen ? !breakpoints.from870 : !breakpoints.from750"
              :label="generateReleaseReport.label" :iconName="generateReleaseReport.icon"
              :isDisabled="!releaseHasResults" @click="handleGenerateReport" />
            <FrogMenuItem v-if="!breakpoints.from920" label="Share release" iconName="share" isDisabled
              @click="showCloseReleaseDialog = true" />
            <FrogMenuItem v-if="!breakpoints.from960" label="Close release" iconName="box-archive"
              :isDisabled="release && release.closed" @click="showCloseReleaseDialog = true" />
            <FrogMenuItem v-if="!breakpoints.from1020" :label="hasSubscribed ? 'Unsubscribe' : 'Subscribe'" :iconName="hasSubscribed ? 'notification-off-bold' : 'notification'
              " @click="handleSubscribeToRelease" />
          </template>
        </VuetifyInlineOrContext>
      </div>
    </VuetifyToolbar>
    <!-- Tabs -->
    <div class="bg-background">
      <v-tabs class="tabs">
        <v-tab v-for="tab in TABS" :key="tab.id" :to="{
              name: tab.route,
              params: { ...urlContext },
              ...(tab.id === 'checks' && currentCheck
                ? {
                  query: {
                    content: contentIdNormalizer(
                      currentCheck.chapterId,
                      currentCheck.requirementId,
                      currentCheck.id
                    ),
                  },
                }
                : undefined),
            }" exact>
          {{ tab.label }}
        </v-tab>
      </v-tabs>
      <router-view />
    </div>

    <VuetifyViewLoadingIndicator v-if="!isLoaded" />
    <!-- Three col -->
    <VuetifyResizableThreeColumnLayout v-else-if="currentTab.id === 'checks'" :class="{ 'sidebar-open': isSidebarOpen }"
      tag="div" :right-panel-max="rightPanelMaxWidth">
      <template #left-panel>
        <template v-if="releaseHasResults">
          <div class="release-details__checks-results"
            :data-onboarding="breakpoints.from1210 ? 'quick-navigation' : ''">
            <nav class="report-block">
              <VuetifyRunReportNav v-if="useNewComponent" :chapters="contentNavItems">
                <template #chapter="chapter">
                  <VuetifyRunReportNavChapter :chapter="chapter" :isOpen="areOpen.includes(chapter.id)"
                    :manual-status="chapter.hasOverride" @toggleChapter="toggleOpen($event)">
                    <template #task>
                      <VuetifyTaskControl v-if="release" :release-id="release.id" :reference="{
                        chapter: chapter.id,
                        requirement: null,
                        check: null,
                      }" />
                    </template>
                    <template #requirement="requirement">
                      <VuetifyRunReportNavRequirement :requirement="requirement">
                        <template #task>
                          <VuetifyTaskControl v-if="release" :release-id="release.id" :reference="{
                            chapter: chapter.id,
                            requirement: requirement.id,
                            check: null,
                          }" />
                        </template>
                        <template #check="check">
                          <VuetifyRunReportNavCheck :check="check" />
                        </template>
                      </VuetifyRunReportNavRequirement>
                    </template>
                  </VuetifyRunReportNavChapter>
                </template>
              </VuetifyRunReportNav>
              <VuetifyReleaseChecksNavigator v-else semantic-header heading-tag="h2" heading-label="Chapters"
                :selected="queryParamsContent" :contentItems="checksNavContent"
                @select-check="(check) => handleCheckChange(check)" />
            </nav>
          </div>
        </template>
      </template>
      <template #middle-panel>
        <div v-if="releaseHasResults" class="release-details__checks-results-details" data-onboarding="check-results">
          <VuetifyReleaseDetailsChecksPager v-if="currentCheck" :check="currentCheck" :currentPage="currentCheckIndex + 1"
            :config-id="release?.qgConfigId" :pages-count="checks.length" :closed="release?.closed"
            @previous="handleGoToPreviousCheck" @next="handleGoToNextCheck" />
        </div>
        <div v-else class="release-details__empty-release">
          <div class="info-text">
            <h3 class="-size-l">No results available</h3>
            <p>Open the configuration and “Execute Run”</p>
            <FrogButton primary @click="
              router.push({
                name: ROUTE_NAMES.CONFIG_EDIT,
                params: {
                  id: release?.qgConfigId,
                  ...urlContext,
                },
                query: {
                  editor: preferredEditor,
                },
              })
              ">
              Open Configuration
            </FrogButton>
          </div>
          <div class="svg-container">
            <VuetifyEmptyRelease />
          </div>
        </div>
      </template>
      <template #right-panel>
        <div v-if="releaseHasResults" class="release-details__checks-comments" data-onboarding="comments">
          <VuetifyCommentInput v-if="!release?.closed" placeholder="Add a comment, @ to mention..."
            :disabled="release?.closed || !currentCheck" @send="handleSendComment($event)" />
          <div v-if="currentCheckComments?.length" class="threads">
            <VuetifyCommentsThread v-for="comment in currentCheckComments" :id="`thread-${comment.id}`" :key="comment.id"
              :thread="comment" :no-reply="release?.closed" :read-only="release?.closed"
              :requested-comment-id="commentId" :requested-parent-comment-id="parentCommentId"
              @reply="handleReplyComment($event)" @resolve="handleResolveComment($event)"
              @reset="handleResetComment($event)" @delete="handleDeleteComment($event)"
              @delete-reply="handleDeleteReplyComment($event, comment.id)" />
          </div>
        </div>
      </template>
    </VuetifyResizableThreeColumnLayout>
    <div v-else-if="currentTab.id === 'history'" class="release-history-wrapper">
      <VuetifyReleaseHistory v-if="release" :release-id="release.id" :is-closed="release?.closed" />
    </div>
    <div v-else-if="currentTab.id === 'tasks'" class="release-tasks-wrapper">
      <VuetifyReleaseTasksTab v-if="release" :release-id="release.id" :is-closed="release?.closed" />
    </div>
    <Teleport to="#app">
      <VuetifyScreenCenter v-if="releaseToDelete">
        <VuetifyDeleteReleaseConfirmation :name="releaseToDelete?.name ?? ''" @confirm="onDeleteReleaseConfirm"
          @cancel="releaseToDelete = null" />
      </VuetifyScreenCenter>
      <VuetifyDialogReleaseApproval v-if="release && showApprovalDialog" :release-id="release.id" :status="releaseStatus"
        :approvers="releaseApprovers" :closed="release.closed" @add-approver="handleAddApprover($event)"
        @remove-approver="handleRemoveApprover($event)" @close="showApprovalDialog = false"
        @approve-release="handleApproveRelease($event)" @reset-approval="handleResetApproval($event)"
        @update-status="handleShowUpdateStatusDialog" />
      <VuetifyDialogReleaseUpdateApprovalStatus v-if="showUpdateStatusDialog && newApprovalState.status"
        :status="newApprovalState.status" :isSaving="isSaving" @update-status="handleUpdateState"
        @close="handleCloseUpdateStatusDialog" />
      <!-- dialog approval state -->
      <VuetifyDialogCloseRelease v-if="release && showCloseReleaseDialog" @close="showCloseReleaseDialog = false" />
      <FrogNotificationBar :show="!!apiError" variant="banner" type="error" full-width with-icon center-icon
        no-content-margin>
        <VuetifyBannerContent :label="apiError" @close="apiError = undefined" />
      </FrogNotificationBar>
      <FrogNotificationBar :show="!!subscribeToReleaseSuccess" variant="banner" type="success" full-width with-icon
        center-icon no-content-margin>
        <VuetifyBannerContent v-if="subscribeToReleaseSuccess" :label="subscribeToReleaseSuccess"
          @close="subscribeToReleaseSuccess = undefined" />
      </FrogNotificationBar>
    </Teleport>
  </main>
</template>
<script setup lang="ts">
import { Tab } from '@B-S-F/frog-vue'
import { onClickOutside, useWindowSize } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import {
  computed,
  defineAsyncComponent,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  watch,
  watchEffect,
} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { PatchReleasePayload, ReleaseComment } from '~/api'
import { ApiError } from '~/api'
import { useUrlContext } from '~/composables'
import { storeContext } from '~/composables/api/context'
import { useApiNetworkError } from '~/composables/api/useApiNetworkError'
import { useApiReleases } from '~/composables/api/useApiReleases'
import { useReleaseFetcher } from '~/composables/fetcher/useReleaseDetailsFetcher'
import useReleaseComments from '~/composables/releaseDetails/useReleaseComments'
import useReleaseDetails from '~/composables/releaseDetails/useReleaseDetails'
import useReleaseDetailsRunReport from '~/composables/releaseDetails/useReleaseDetailsRunReport'
import useReleaseTasksTab from '~/composables/releaseDetails/useReleaseTasksTab'
import useTaskDialog from '~/composables/releaseDetails/useTaskDialog'
import { useBreakpoints } from '~/composables/useBreakPoints'
import useConfigFindings from '~/composables/useConfigFindings'
import useFeatureFlags from '~/composables/useFeatureFlags'
import { useSidebarChecker } from '~/composables/useSidebarChecker'
import { DOUBLE_HYPHEN } from '~/config/app'
import { contentIdNormalizer } from '~/helpers'
import { findingsLabel } from '~/helpers/getFindingsCrossNavigationString'
import { getVuetifyReleaseStatusPillInfo } from '~/helpers/getPillInfo'
import { TOOLTIP_CONFIG } from '~/helpers/getTooltipConfig'
import { ROUTE_NAMES } from '~/router'
import { useConfigStore } from '~/store/useConfigStore'
import { useRelationStore } from '~/store/useRelationStore'
import { useReleaseCommentsStore } from '~/store/useReleaseCommentsStore'
import { useReleaseHistoryStore } from '~/store/useReleaseHistoryStore'
import useReleaseReportStore from '~/store/useReleaseReportStore'
import { useReleaseStore } from '~/store/useReleaseStore'
import useReleaseTasksStore from '~/store/useReleaseTasksStore'
import { useRunStore } from '~/store/useRunStore'
import useUserProfileStore from '~/store/useUserProfileStore'
import { StatusPillDisplay } from '~/types'
import { Check, ContentItem, Release } from '~/types/Release'
import { TaskFormData } from '~/types/Task'

const DeleteReleaseConfirmation = defineAsyncComponent(
  () => import('~/components/organisms/VuetifyDeleteReleaseDialog.vue'),
)
const relationStore = useRelationStore()
const releaseStore = useReleaseStore(storeContext)
const configStore = useConfigStore(storeContext)
const runStore = useRunStore(storeContext)

/**
 * Common
 */
const isLoaded = ref<boolean>(false)
const apiError = ref<string>()
/**
 * Router
 */
const { urlContext, envPathPrefix } = useUrlContext()
const route = useRoute()
const router = useRouter()
const backLink = computed(() => ({
  label: 'Back to releases',
  to: { name: ROUTE_NAMES.RELEASE_OVERVIEW, params: urlContext.value },
}))
const { isSidebarOpen } = useSidebarChecker()

/**
 * Checks navigator
 */
const showChecksNavigator = ref<boolean>(false)
const releaseChecksNavigatorRef = ref<InstanceType<typeof HTMLElement>>()
onClickOutside(releaseChecksNavigatorRef, (event) => {
  event.stopPropagation()
  showChecksNavigator.value = false
})
const removeShowChecksNavigator = () => {
  if (!showChecksNavigator.value) return
  showChecksNavigator.value = false
}
addEventListener('resize', removeShowChecksNavigator)
onUnmounted(() => removeEventListener('resize', removeShowChecksNavigator))

const { width: windowWidth } = useWindowSize()
const rightPanelMaxWidth = computed(() =>
  windowWidth.value >= 1200 ? 800 : 540,
)
const breakpoints = useBreakpoints()

const manageApprovalLabel = computed(() =>
  release.value?.closed ? 'Approval details' : 'Manage approval',
)
const closedReleasePill: StatusPillDisplay =
  getVuetifyReleaseStatusPillInfo('closed')

/**
 * RELEASE DETAILS FETCHING
 */
const { release } = useReleaseDetails()
const {
  approveRelease,
  addApproval,
  removeApprover,
  resetApproval,
  patchRelease,
  deleteRelease,
  getCommentsByReference,
  manageReleaseSubscription,
} = useApiReleases()
const {
  fetchAllApproversState,
  releaseStatus,
  releaseApprovers,
  fetchReleaseData,
  fetchReleaseApprovalState,
  releaseSubscription,
  checkReleaseSubscription,
} = useReleaseFetcher({ id: route.params.id as string })
const {
  report,
  getReleaseRunReport,
  checksNavContent,
  checks,
  currentCheck,
  contentNavItems,
  useNewComponent,
  areOpen,
  toggleOpen,
  overallResultPill,
  vuetifyOverallResultPill,
} = useReleaseDetailsRunReport(route.params.id as string)
const releaseHasResults = computed(() => !!report.value)
const userProfileStore = useUserProfileStore()
const { editor: preferredEditor } =
  storeToRefs(userProfileStore).userProfile.value
const { fetchReleaseTasks } = useReleaseTasksStore()
const { addTask } = useReleaseTasksTab()
onMounted(() => {
  releaseStore
    .getOrFetch(route.params.id as unknown as number)
    .then(async (r) => {
      if (r.resource) {
        release.value = r.resource
        await fetchReleaseData()
        await getReleaseRunReport()
        if (useNewComponent) await fetchReleaseTasks(r.resource.id)
        await commentsStore.fetchComments(release.value.id)
      } else {
        apiError.value = r.error.msg
      }
    })
    .catch(() => {
      apiError.value = useApiNetworkError()
    })
    .finally(() => {
      isLoaded.value = true
    })
})

const setRelationStore = async () => {
  if (!release.value) return
  const configId = releaseStore.getById(Number(release.value.id))?.qgConfigId
  const configName = configStore.getById(Number(configId))?.name

  if (configId) {
    await getFindingsCount(configId.toString(), true)
    const { ok, resource } = await runStore.getOrFetchLastRun(configId)
    if (ok && resource) {
      relationStore.setSmartRelation({
        configuration: {
          name: configName ? configName : '',
          id: configId ? configId.toString() : '',
        },
        run: {
          id: resource.id.toString(),
        },
        findings: {
          label: findingsLabel(findingsAmount.value),
        },
      })
    }
  }
}

/**
 * Tabs navigation
 */
type ReleaseDetailsTab = Tab & { route: string }
const TABS = [
  {
    id: 'checks',
    label: 'Checks',
    href: `${envPathPrefix.value}/releases/${route.params.id}/details/checks`,
    route: ROUTE_NAMES.RELEASE_DETAILS_CHECKS,
  },
  {
    id: 'history',
    label: 'History',
    href: `${envPathPrefix.value}/releases/${route.params.id}/details/history`,
    route: ROUTE_NAMES.RELEASE_DETAILS_HISTORY,
  },
  ...(useNewComponent
    ? [
        {
          id: 'tasks',
          label: 'Tasks',
          href: `${envPathPrefix.value}/releases/${route.params.id}/details/tasks`,
          route: ROUTE_NAMES.RELEASE_DETAILS_TASKS,
        },
      ]
    : []),
] satisfies ReleaseDetailsTab[]
const currentTab = ref<ReleaseDetailsTab>(TABS[0])
onMounted(() => {
  if (route.name === ROUTE_NAMES.RELEASE_DETAILS_HISTORY) {
    currentTab.value = TABS[1]
  } else if (route.name === ROUTE_NAMES.RELEASE_DETAILS_CHECKS) {
    currentTab.value = TABS[0]
  } else if (route.name === ROUTE_NAMES.RELEASE_DETAILS_TASKS) {
    currentTab.value = TABS[2]
  }
})
watch(route, (newRoute) => {
  if (newRoute.name === ROUTE_NAMES.RELEASE_DETAILS_HISTORY) {
    currentTab.value = TABS[1]
  } else if (newRoute.name === ROUTE_NAMES.RELEASE_DETAILS_CHECKS) {
    currentTab.value = TABS[0]
    if (currentCheck.value && release.value) {
      fetchCurrentCheckComments(currentCheck.value, release.value?.id)
    }
  } else if (newRoute.name === ROUTE_NAMES.RELEASE_DETAILS_TASKS) {
    currentTab.value = TABS[2]
  }
})

/**
 * CURRENT CHECK
 */

const currentCheckIndex = computed(() =>
  checks.value.findIndex((c) => c.pageId === currentCheck.value?.pageId),
)
const queryParamsContent = computed(() => route.query.content as string)
const checkInQueryParams = computed(() => {
  if (!queryParamsContent.value) {
    return undefined
  }
  const queryParams = queryParamsContent.value.split(DOUBLE_HYPHEN)
  if (queryParams.length !== 6) {
    return undefined
  }
  const [, chapterId, , requirementId, , checkId] = queryParams

  if (!chapterId || !requirementId || !checkId) {
    return undefined
  }

  const checkIdx = checks.value.findIndex((c) => {
    return (
      c.id === checkId &&
      c.chapterId === chapterId &&
      c.requirementId === requirementId
    )
  })
  if (checkIdx === -1) {
    return undefined
  }
  return checks.value[checkIdx]
})
onMounted(() => {
  if (
    route.name === ROUTE_NAMES.RELEASE_DETAILS_CHECKS &&
    queryParamsContent.value
  ) {
    const [, chapterId, , requirementId, , checkId] =
      queryParamsContent.value.split(DOUBLE_HYPHEN)
    if (!chapterId || !requirementId || !checkId) return
    const checkIdx = checks.value.findIndex(
      (c) =>
        c.id === checkId &&
        c.chapterId === chapterId &&
        c.requirementId === requirementId,
    )
    if (checkIdx === -1) return
    currentCheck.value = checks.value[checkIdx]
  }
})

const handleGoToPreviousCheck = () => {
  if (currentCheckIndex.value === 0) return
  currentCheck.value = checks.value[currentCheckIndex.value - 1]
}

const handleGoToNextCheck = () => {
  if (currentCheckIndex.value === checks.value.length - 1) return
  currentCheck.value = checks.value[currentCheckIndex.value + 1]
}

const handleCheckChange = (check: ContentItem) => {
  showChecksNavigator.value = false
  currentCheck.value = checks.value.find((c) => c.pageId === check.pageId)
}

watch(checks, (newVal) => {
  // If checks change, we need to reset
  if (newVal.length) {
    currentCheck.value = checkInQueryParams.value
      ? checkInQueryParams.value
      : checks.value[0]
  }
})

watch(currentCheck, async (newCheck) => {
  if (route.name !== ROUTE_NAMES.RELEASE_DETAILS_CHECKS || !newCheck) return
  router.replace({
    query: {
      content: contentIdNormalizer(
        newCheck.chapterId,
        newCheck.requirementId,
        newCheck.id,
      ),
      commentId: commentId.value,
      parentCommentId: parentCommentId.value,
    },
  })
})

watch(queryParamsContent, (newContent) => {
  if (!newContent) return
  const [, chapterId, , requirementId, , checkId] =
    newContent.split(DOUBLE_HYPHEN)
  if (!chapterId || !requirementId || !checkId) return
  const checkIdx = checks.value.findIndex(
    (c) =>
      c.id === checkId &&
      c.chapterId === chapterId &&
      c.requirementId === requirementId,
  )
  if (checkIdx === -1) return
  currentCheck.value = checks.value[checkIdx]
})

/**
 * QUERIED CHECK COMMENTS
 */
const commentId = computed(() => {
  const id = Number(route.query.commentId)
  return isNaN(id) ? undefined : id
})

const parentCommentId = computed(() => {
  const id = Number(route.query.parentCommentId)
  return isNaN(id) ? undefined : id
})

watch(commentId, (newCommentId) => {
  if (!newCommentId) return
  scrollToComment(newCommentId)
})

watch(route, (newRoute) => {
  if (newRoute.name === ROUTE_NAMES.RELEASE_DETAILS_CHECKS) {
    if (commentId.value) {
      scrollToComment(commentId.value)
    }
  }
})

onMounted(() => {
  if (commentId.value) {
    scrollToComment(commentId.value)
  }
})

const scrollToComment = (commentId: number) => {
  nextTick(() => {
    setTimeout(() => {
      const commentElement =
        document.querySelector(`#thread-${commentId}`) ||
        document.querySelector(`#reply-${commentId}`)
      if (commentElement) {
        commentElement.scrollIntoView({ behavior: 'smooth' })
      }
    }, 1000)
  })
}

/**
 * CURRENT CHECK COMMENTS
 */

const currentCheckComments = ref<ReleaseComment[]>([])

const fetchCurrentCheckComments = async (check: Check, releaseId: number) => {
  try {
    const { id: checkId, chapterId, requirementId } = check
    const r = await getCommentsByReference({
      releaseId,
      check: checkId,
      requirementId,
      chapterId,
      type: 'check',
    })
    if (r.ok) {
      const comments = await r.json()
      currentCheckComments.value = comments?.comments
    } else {
      apiError.value = ((await r.json()) as ApiError)?.message
    }
  } catch (error) {
    apiError.value = useApiNetworkError()
  }
}
watch([currentCheck, release], async ([newCheck, newRelease]) => {
  if (!newCheck || !newRelease) return
  await fetchCurrentCheckComments(newCheck, newRelease?.id)
})

// Set up the interval to fetch comments every 5 seconds
let commentsInterval: ReturnType<typeof setInterval>
onMounted(() => {
  commentsInterval = setInterval(async () => {
    if (currentCheck.value && release.value) {
      await fetchCurrentCheckComments(currentCheck.value, release.value.id)
    }
  }, 5000)
})

onUnmounted(() => {
  clearInterval(commentsInterval)
})

const {
  AddCommentToAReleaseCheck,
  replyComment,
  resolveComment,
  resetComment,
  deleteComment,
  deleteReply,
} = useReleaseComments(currentCheckComments)

const handleSendComment = async (comment: string) => {
  try {
    if (!release.value || !currentCheck.value) return
    const { chapterId, requirementId, id: checkId } = currentCheck.value
    await AddCommentToAReleaseCheck(release.value.id, comment, {
      chapterId,
      requirementId,
      checkId,
    })
  } catch (error) {
    apiError.value = error as string
  }
}

const handleReplyComment = async ({
  id,
  comment,
}: {
  id: number
  comment: string
}) => {
  try {
    if (!release.value) return
    await replyComment(release.value.id, { commentId: id, comment })
  } catch (error) {
    apiError.value = error as string
  }
}

const handleResolveComment = async (commentId: number) => {
  try {
    if (!release.value) return
    await resolveComment(release.value.id, commentId)
  } catch (error) {
    apiError.value = error as string
  }
}

const handleResetComment = async (commentId: number) => {
  try {
    if (!release.value) return
    await resetComment(release.value.id, commentId)
  } catch (error) {
    apiError.value = error as string
  }
}

const handleDeleteComment = async (commentId: number) => {
  try {
    if (!release.value) return
    await deleteComment(release.value.id, commentId)
  } catch (error) {
    apiError.value = error as string
  }
}

const handleDeleteReplyComment = async (
  commentId: number,
  parentCommentId: number,
) => {
  try {
    if (!release.value) return
    await deleteReply(release.value.id, commentId, parentCommentId)
  } catch (error) {
    apiError.value = error as string
  }
}

/**
 * APPROVAL DIALOG
 */

const showApprovalDialog = ref<boolean>(false)
const commentsStore = useReleaseCommentsStore()
const { comments: releaseComments } = storeToRefs(commentsStore)
const releaseHistoryStore = useReleaseHistoryStore()
const handleApproveRelease = async ({
  userId,
  comment,
}: {
  userId: string
  comment: string
}) => {
  try {
    if (!release?.value) return
    const r = await approveRelease({ releaseId: release?.value.id, comment })
    if (r.ok) {
      const idx = releaseApprovers.value.findIndex(
        (a) => String(a.id) === userId,
      )
      if (idx === -1) return
      releaseApprovers.value.splice(idx, 1, {
        ...releaseApprovers.value[idx],
        state: 'approved',
      })
      await commentsStore.fetchComments(release.value.id)
      await fetchReleaseApprovalState()
      if (currentTab.value.id === 'history')
        await releaseHistoryStore.fetchHistory(release.value.id)
    } else {
      apiError.value = ((await r.json()) as ApiError)?.message
    }
  } catch (error) {
    apiError.value = useApiNetworkError()
  }
}

const handleResetApproval = async ({
  userId,
  comment,
}: {
  userId: string
  comment: string
}) => {
  try {
    if (!release?.value) return
    const r = await resetApproval({ releaseId: release?.value.id, comment })
    if (r.ok) {
      const idx = releaseApprovers.value.findIndex(
        (a) => String(a.id) === userId,
      )
      if (idx === -1) return
      releaseApprovers.value.splice(idx, 1, {
        ...releaseApprovers.value[idx],
        state: 'pending',
      })
      await commentsStore.fetchComments(release.value.id)
      await fetchReleaseApprovalState()
      if (currentTab.value.id === 'history')
        await releaseHistoryStore.fetchHistory(release.value.id)
    } else {
      apiError.value = ((await r.json()) as ApiError)?.message
    }
  } catch (error) {
    apiError.value = useApiNetworkError()
  }
}

const handleAddApprover = async ({ user }: { user: string }) => {
  try {
    if (!release.value) return
    const r = await addApproval({
      user,
      releaseId: release.value.id,
    })
    if (r.ok) {
      await Promise.all([
        fetchReleaseApprovalState(),
        fetchAllApproversState(),
        releaseHistoryStore.fetchHistory(release.value.id),
      ])
    } else {
      apiError.value = ((await r.json()) as ApiError).message
    }
  } catch (e) {
    apiError.value = useApiNetworkError()
  }
}
const handleRemoveApprover = async (approverId: number) => {
  try {
    if (!release.value) return
    const r = await removeApprover({
      releaseId: release.value?.id,
      approverId,
    })
    if (r.ok) {
      const findApproverIdx = releaseApprovers.value.findIndex(
        (approver) => approver.id === approverId,
      )
      if (findApproverIdx === -1) return
      releaseApprovers.value.splice(findApproverIdx, 1)
      await Promise.all([
        fetchReleaseApprovalState(),
        fetchAllApproversState(),
        releaseHistoryStore.fetchHistory(release.value.id),
      ])
    } else {
      apiError.value = ((await r.json()) as ApiError).message
    }
  } catch (error) {
    apiError.value = useApiNetworkError()
  }
}

watch(parentCommentId, async (newCommentId) => {
  if (newCommentId) {
    showApprovalDialogOnCommentQuery(newCommentId)
  }
})

watch(route, (newRoute) => {
  if (newRoute.name === ROUTE_NAMES.RELEASE_DETAILS_CHECKS) {
    if (parentCommentId.value) {
      showApprovalDialogOnCommentQuery(parentCommentId.value)
    }
  }
})

onMounted(async () => {
  if (parentCommentId.value) {
    showApprovalDialogOnCommentQuery(parentCommentId.value)
  }
})

const showApprovalDialogOnCommentQuery = (commentId: number) => {
  nextTick(() => {
    setTimeout(() => {
      const comment = releaseComments.value.find((c) => c.id === commentId)
      if (comment) {
        showApprovalDialog.value = true
      }
    }, 1000)
  })
}
/**
 * Close Release
 */
const showCloseReleaseDialog = ref<boolean>(false)
/**
 * DELETE RELEASE
 */

const releaseToDelete = ref<Release | null>(null)
const onDeleteReleaseConfirm = async () => {
  const releaseId = releaseToDelete.value?.id
  if (releaseId === undefined) return
  try {
    const r = await deleteRelease(releaseId)
    if (!r.ok) {
      apiError.value = ((await r.json()) as ApiError).message
    } else {
      useReleaseStore(storeContext).removeById(releaseId)
      router.push({ name: ROUTE_NAMES.RELEASE_OVERVIEW })
    }
  } catch (e) {
    apiError.value = useApiNetworkError()
  } finally {
    releaseToDelete.value = null
  }
}
/**
 * EDIT RELEASE
 */
const showEditReleasePopover = ref<boolean>(false)
const handleEditReleaseMetaData = {
  confirm: async (payload: PatchReleasePayload) => {
    try {
      if (!release.value) return
      const r = await patchRelease(release.value?.id, payload)
      if (r.ok) {
        const updatedRelease = (await r.json()) as Release
        release.value = updatedRelease
        showEditReleasePopover.value = false
      } else {
        apiError.value = ((await r.json()) as ApiError)?.message
      }
    } catch (e) {
      useApiNetworkError()
    }
  },
  close: () => {
    showEditReleasePopover.value = false
  },
}

const { findingsAmount, getFindingsCount } = useConfigFindings()
watchEffect(async () => {
  if (!release.value) return
  await setRelationStore()
})

watch(findingsAmount, async () => {
  await setRelationStore()
})

const newApprovalState = ref<{
  approverId: string | undefined
  status: string | undefined
}>({ approverId: undefined, status: undefined })
const showUpdateStatusDialog = ref<boolean>(false)
const handleShowUpdateStatusDialog = (payload: {
  userId: string
  status: string
}) => {
  newApprovalState.value.approverId = payload.userId
  newApprovalState.value.status = payload.status
  showUpdateStatusDialog.value = true
}
const handleCloseUpdateStatusDialog = () => {
  newApprovalState.value.approverId = undefined
  newApprovalState.value.status = undefined
  showUpdateStatusDialog.value = false
}
const handleUpdateState = async (payload: {
  status: string
  comment: string
}) => {
  isSaving.value = true
  newApprovalState.value.status = payload.status
  if (!newApprovalState.value.approverId) return
  if (payload.status === 'approved')
    await handleApproveRelease({
      userId: newApprovalState.value.approverId,
      comment: payload.comment,
    })
  if (payload.status === 'pending')
    await handleResetApproval({
      userId: newApprovalState.value.approverId,
      comment: payload.comment,
    })
  handleCloseUpdateStatusDialog()
  isSaving.value = false
}
const isSaving = ref<boolean>(false)

/**
 * Subscribe to a release
 */
const { useReleaseEmails } = useFeatureFlags()
const hasSubscribed = computed(() => !!releaseSubscription.value)
const subscribeToReleaseSuccess = ref<string>()
const handleSubscribeToRelease = async () => {
  try {
    if (release?.value && release?.value?.id) {
      const r = await manageReleaseSubscription({
        releaseId: Number(release?.value?.id),
        operation: releaseSubscription.value ? 'unsubscribe' : 'subscribe',
      })
      if (r.ok) {
        subscribeToReleaseSuccess.value = `You have successfully ${
          releaseSubscription.value ? 'unsubscribed' : 'subscribed'
        } to this release`
        await checkReleaseSubscription()
      }
    }
  } catch (error) {
    console.error('Subscribe to release', { error })
  }
}

/**
 * Download report
 */
const releaseReportStore = useReleaseReportStore()
const { isGeneratingReport } = storeToRefs(releaseReportStore)
const generateReleaseReport = computed(() =>
  isGeneratingReport.value
    ? {
        label: 'Generating...',
        icon: 'mdi-sync',
        class: 'downloading',
      }
    : {
        label: releaseHasResults.value
          ? 'Generate report'
          : 'No report available',
        icon: 'mdi-download-outline',
        onClick: () => handleGenerateReport(),
        isDisabled: !releaseHasResults.value,
      },
)

const handleGenerateReport = async () => {
  if (release.value) {
    await releaseReportStore.generateReport({
      releaseId: release.value.id,
      configId: release.value.qgConfigId,
      runId: release.value.lastRunId,
    })
    if (report.value) {
      const newRoute = router.resolve({
        name: ROUTE_NAMES.RELEASE_REPORT,
      }).href
      window.open(window.origin + newRoute)
    }
  }
}

/** Task */

const { showTaskDialog, handleShowTaskDialog, handleCreateTask } =
  useTaskDialog()
const onCreateTask = async (payload: TaskFormData) => {
  if (release.value) {
    const createdTask = await handleCreateTask(release.value.id, payload)
    if (createdTask) addTask(createdTask)
    showTaskDialog.value = false
  }
}
</script>
<style scoped lang="scss">
@use "../../styles/tokens.scss" as *;
@use "../../styles/abstract" as *;
@use "../../styles/helpers.scss" as *;
@use "../../styles/mixins/flex.scss" as Flex;
@use "../../styles/mixins/context-menu-editor.scss" as *;
@use "../../styles/mixins/resizable-one-column-layout.scss" as *;

// Special breakpoints for the toolbar
$bp-max-1270: 1270px;
$bp-max-1020: 1020px;
$bp-max-870: 870px;
$bp-max-550: 550px;

main {
  height: 100%;
  overflow: auto;
  padding: $viewPadding 0;
}

.settings-tabs {
  margin: 0;

  :deep(.a-tab-navigation) {
    margin: 0;

  }
}

.release-details {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  // grid column layout similar to the app one
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: $viewPadding;

  >* {
    grid-column: 1 / span 12;
  }

  &__toolbar {
    grid-row: 1;

    h5 {
      font-size: rem(14px);
    }
  }

  &__name-wrapper {
    max-width: 240px;

    @media screen and (max-width: $bp-max-820) {
      max-width: 140px;
    }
  }

  &__tabs {
    grid-row: 2;
    margin: 0;

    :deep(.a-tab-navigation) {
      background-color: var(--background);
      margin: 0;
    }
  }

  &__content {
    position: relative;
    grid-row: 3;
  }

  :deep(.resizable-three-col-layout .left-panel) {
    background-color: var(--background);
  }

  :deep(.resizable-three-col-layout .middle-panel) {
    background-color: var(--background);
    overflow-y: auto;

    @media screen and (max-width: $bp-max-1020) {
      overflow-y: unset;
    }
  }

  :deep(.resizable-three-col-layout .right-panel) {
    background-color: var(--background);
    overflow-y: auto;

    @media screen and (max-width: $bp-max-1020) {
      overflow-y: unset;
    }
  }

  :deep(.resizable-three-col-layout .left-panel .release-details__checks-results) {
    overflow-y: auto;
    height: 100%;
    scroll-behavior: smooth;
  }

  :deep(.resizable-three-col-layout .right-panel .release-details__checks-comments) {
    height: 100%;
    scroll-behavior: smooth;
  }

  :deep(.resizable-three-col-layout .middle-panel:has(.release-details__empty-release)) {
    position: relative;
  }

  :deep(.resizable-three-col-layout .middle-panel:has(.release-details__empty-release) .svg-container) {
    position: absolute;
    bottom: 0;
    width: 100%;
  }

  :deep(.resizable-three-col-layout .middle-panel:has(.release-details__empty-release) .svg-container svg) {
    display: block;
  }

  &__checks-results,
  &__checks-results-details,
  &__checks-comments {
    padding: $space-component-l;
  }

  &__checks-comments {
    display: grid;
    grid-template-rows: minmax(0, auto) minmax(0, 1fr);
    row-gap: $space-section;

    .threads {
      overflow: auto;
    }
  }

  &__empty-release {
    height: 100%;
    @include Flex.flexbox;
    text-align: center;

    .info-text {
      width: 100%;
      @include Flex.flexbox($direction: column);

      h3,
      p {
        margin: 0;
      }

      p {
        margin-bottom: 48px;
      }
    }
  }
}

:global(.edit-release-dialog .m-popover__content) {
  padding: 0;
}

:global(.edit-release-dialog .m-popover__head) {
  display: flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  justify-content: space-between;
  border-bottom: 0.0625rem solid var(--small__enabled__fill__default);
}

:global(.edit-release-dialog .m-popover__head h5) {
  margin: 0;
}

:global(.edit-release-dialog .m-popover__head button.a-button) {
  position: inherit;
}

:global(.edit-release-dialog .m-popover__content .container) {
  padding: $spacing-24 $spacing-16 $spacing-32 $spacing-16;
}

:global(.edit-release-dialog .m-popover__content .actions button) {
  flex: 1;
}

.release-status-label {
  text-transform: capitalize;

  @media screen and (max-width: $bp-max-1020) {
    display: none;
  }
}

.release-history-wrapper,
.release-tasks-wrapper {
  overflow: auto;
  scroll-behavior: smooth;
}

:global(.o-minimal-header__top .separator) {
  grid-template-columns: auto 1fr auto;
}

.release-details__toolbar {
  @media screen and (max-width: $bp-max-1500) {
    :deep(.a-button--tertiary) {
      @include hide-label-and-center-icon;
    }
  }

  @media screen and (max-width: $bp-max-1270) {
    :deep(.a-button--secondary) {
      @include hide-label-and-center-icon;
    }

    :deep(.manage-approval-btn) {
      padding: 0;

      .a-button__right {
        display: none;
      }
    }

    :deep(.a-button) {
      @include hide-label-and-center-icon;
    }
  }

  &.sidebar-open {
    :deep(.a-button--secondary) {
      @include hide-label-and-center-icon;
    }

    :deep(.manage-approval-btn) {
      padding: 0;

      .a-button__right {
        display: none;
      }
    }
  }

  @media screen and (max-width: $bp-max-820) {
    :deep(.name) {
      max-width: min(var(--mw), 50px);
    }

    :deep(.release-status-label) {
      display: none;
    }
  }
}

.name {
  max-width: min(var(--mw), 350px);
  margin: 0 12px 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.resizable-three-col-layout {
  @media screen and (max-width: $bp-max-1210) {
    @include resizable-one-column-layout();
  }

  &.sidebar-open {
    @media screen and (max-width: $bp-max-1440) {
      @include resizable-one-column-layout();
    }
  }
}

.-from-md {
  display: none;

  @media screen and (max-width: $bp-max-1210) {
    display: flex;
  }
}

.checks-navigator-panel {
  max-width: 100%;
}

:global(.m-popover.checks-navigator-popover .m-popover__content) {
  width: 360px;
  max-width: 360px;
  height: 75vh;
}

:global(.m-popover.checks-navigator-popover .checks-navigator-panel) {
  height: 100%;
  width: 100%;
  overflow-y: auto;
  scroll-behavior: smooth;
}

.downloading {

  svg,
  .a-icon {
    animation: rotating 2s linear infinite;
  }
}

.context-menu-container {
  display: none;

  &::after {
    width: 0 !important;
    height: 0 !important;
  }

  --context-menu-y: 10.85%;

  :deep(ul.context-menu.semantic-list) {
    right: $spacing-64;
  }

  &.sidebar-open {
    @include context-menu-editor(calc($bp-max-1020 + $sideNavigationExpandedWidth));

    @media screen and (max-width: $bp-max-870) {
      width: 60px !important;
      margin: 0;
    }
  }

  &:not(.sidebar-open) {
    @include context-menu-editor($bp-max-1020);

    @media screen and (max-width: $bp-max-550) {
      width: 60px !important;
      margin: 0;
    }
  }
}

.-no-vertical-borders {
  ::after {
    width: 0 !important;
    height: 0 !important;
  }
}

.manage-approval-btn {
  :deep(.a-button__icon) {
    padding: 0;
  }

  :deep(.a-button__label) {
    padding: 0;
  }

  padding: 11px 16px 11px 14px;
  height: $spacing-48;
  align-items: center;
  column-gap: 8px;
}

.tabs {
  :deep(.v-btn__content) {
    text-decoration: none;
  }
}

</style>
