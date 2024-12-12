<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <main class="run-results-view" :class="{ 'resizing': isResizingLeftPanel }">
    <div class="onboarding-element-without-focus" data-onboarding="run-overview" />
    <VuetifyToolbar class="result-toolbar">
      <FrogPopover attached triggerOnHover tooltipAlike arrowPlacementClass="-without-arrow-top"
        label="Back to overview">
        <VuetifyBackLink :to="{ name: ROUTE_NAMES.RUNS_OVERVIEW, params: urlContext }" />
        <div class="-from-sm">
          <FrogPopover attached arrowPlacementClass="-top-left" pophoverClass="navigator-panel" :show="showNavigator"
            style="--y-shift: 0.5rem">
            <FrogButton secondary :icon="showNavigator ? 'mdi-close' : 'mdi-file-document-outline'"
              :data-onboarding="!breakpoints.from1020 ? 'navigate-between-chapters' : ''"
              @click="showNavigator = !showNavigator" />
            <template #content>
              <!-- for clickoutside event -->
              <div v-if="showNavigator" ref="navigatorPanelRef" class="editor-panel" :style="{
                '--navigator-panel-width': '360px',
              }">
                <VuetifyRunReportNav v-if="useNewComponent" :chapters="contentNavItems">
                  <template #chapter="chapter">
                    <VuetifyRunReportNavChapter :chapter="chapter" :isOpen="areOpen.includes(chapter.id)"
                      @toggleChapter="toggleOpen($event)">
                      <template #requirement="requirement">
                        <VuetifyRunReportNavRequirement :requirement="requirement">
                          <template #check="check">
                            <VuetifyRunReportNavCheck :check="check" />
                          </template>
                        </VuetifyRunReportNavRequirement>
                      </template>
                    </VuetifyRunReportNavChapter>
                  </template>
                </VuetifyRunReportNav>
                <VuetifyContentNavigation v-else semantic-header heading-tag="h2" heading-label="Chapters"
                  :selected="currentContent" :contentItems="oldComponentContentNav" />
              </div>
            </template>
          </FrogPopover>
        </div>
      </FrogPopover>
      <div>
        <h1 class="text-h6 font-weight-bold">
          {{ runIdParam }}
        </h1>
      </div>
      <div class="toolbar-gap">
        <FrogButton secondary icon="mdi-file-code-outline" :title="showLogs ? 'Hide logs' : 'Show logs'"
          data-cy="logs-button" @click="onShowLogsToggle(!showLogs)">
          <VuetifyStack v-slot="{ visibleClass }">
            <span class="nowrap" :class="{ [visibleClass]: !showLogs }">Show Logs</span>
            <span class="nowrap" :class="{ [visibleClass]: showLogs }">Hide logs</span>
          </VuetifyStack>
        </FrogButton>
        <FrogButton secondary title="Download Evidence" data-cy="evidence-button"
          :class="{ 'downloading': isDownloadingEvidences }"
          :icon="isDownloadingEvidences ? 'mdi-sync' : 'mdi-download'" :disabled="!runIdParam"
          @click="onEvidencesDownload">
          <VuetifyStack v-slot="{ visibleClass }">
            <span class="nowrap" :class="{ [visibleClass]: !isDownloadingEvidences }">Download Evidences</span>
            <span class="nowrap" :class="{ [visibleClass]: isDownloadingEvidences }">Downloading...</span>
          </VuetifyStack>
        </FrogButton>
      </div>
      <!-- <div class="toolbar-gap">
        <FrokButton tertiary icon="share" data-cy="share-button">
          Share
        </FrokButton>
        <FrokButton tertiary icon="delete" title="Delete" data-cy="delete-report">
          Delete
        </FrokButton>
      </div> -->
    </VuetifyToolbar>
    <VuetifyRunReportHeader v-if="report" class="result-header" :overallResult="report.overallStatus"
      :name="report.header.name" :date="useRecentDateFormat(report.header.date, { forceDateString: true })"
      :version="report.header.version" />
    <div id="run-result-content" class="content">
      <div ref="leftPanelRef" class="side-content" :style="{
        '--left-panel-width': `${leftPanelWidth}px`
      }">
        <VuetifyRunReportResults v-model:filterBy="filterBy" class="report-block result-progress"
          :results="reportStats?.results" :answered="reportStats?.answered" data-onboarding="run-chart" />
        <nav ref="leftPanelRef" class="report-block report-container bg-background"
          :data-onboarding="breakpoints.from1020 ? 'navigate-between-chapters' : ''" :style="{
            '--left-panel-width': `${leftPanelWidth}px`
          }">
          <VuetifyRunReportNav v-if="useNewComponent" :chapters="contentNavItems">
            <template #chapter="chapter">
              <VuetifyRunReportNavChapter :chapter="chapter" :isOpen="areOpen.includes(chapter.id)"
                @toggleChapter="toggleOpen($event)">
                <template #requirement="requirement">
                  <VuetifyRunReportNavRequirement :requirement="requirement">
                    <template #check="check">
                      <VuetifyRunReportNavCheck :check="check" />
                    </template>
                  </VuetifyRunReportNavRequirement>
                </template>
              </VuetifyRunReportNavChapter>
            </template>
          </VuetifyRunReportNav>
          <VuetifyContentNavigation v-else semantic-header heading-tag="h2" heading-label="Chapters"
            :selected="currentContent" :contentItems="oldComponentContentNav" />
          <FrogButton icon="mdi-arrow-split-vertical" class="resize-btn" integrated arial-label="resize panel"
            @mousedown="resizeLeftPanel" />
        </nav>
      </div>
      <VuetifySummaryOfChecks v-if="currentChapters && run" class="report-block" :chapters="currentChapters"
        :config-id="run.configId" :findings="findings ?? []" :target="currentContent" data-onboarding="checks-result"
        @show-autopilot="showAutopilot = $event" @explain-autopilot="get({ ...$event, runId: String(run.id) })" />
    </div>
    <Teleport to="#app">
      <FrogNotificationBar :show="!!apiError" variant="banner" type="error" full-width with-icon center-icon
        no-content-margin>
        <VuetifyBannerContent :label="apiError" @close="apiError = undefined" />
      </FrogNotificationBar>
      <VuetifyLogsPanel v-if="showLogs && run && configOfRun" class="logs-panel"
        :config="{ id: configOfRun.id, name: configOfRun.name }" :run="run" @close="showLogs = false"
        @click-outside="() => { showLogs = false; toggleOnTime = false }" />
      <VuetifyAutopilotLogsPanel v-if="showAutopilot && run" :evaluation="showAutopilot"
        @close="showAutopilot = undefined" @click-outside="showAutopilot = undefined" />
      <VuetifyBottomDialogPanel v-if="showExplainableDialog" v-model:open="showExplainableDialog"
        :is-loading="isLoading" :error="aiError">
        <template #headline>
          <FrogIcon icon="mdi-robot" />
          <h1 class="heading text-body-1 font-weight-bold">
            AI Helper
          </h1>
        </template>

        <template #content>
          <h5 class="text-body-1 font-weight-bold">
            Explanation of autopilot
          </h5>
          <p>{{ explanation }}</p>
        </template>
        <template #footer>
          <h5 class="text-body-1 font-weight-bold">
            Need further assistance?
          </h5>
          <ul class="semantic-list">
            <li class="a-link -icon">
              <a href="https://docs.bswf.tech/" target="_blank">
                <FrogIcon icon="mdi-help-circle-outline" />
                <span>Documentation</span>
              </a>
            </li>
          </ul>
        </template>
      </VuetifyBottomDialogPanel>
    </Teleport>
  </main>
</template>

<script setup lang="ts">
import { onClickOutside, useWindowSize } from '@vueuse/core'
import { computed, onUnmounted, ref, watch, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import type { GetRun } from '~/api'
import {
  useDebugMode,
  useRecentDateFormat,
  useResizeDnD,
  useUrlContext,
  useYakuBrowseHistory,
} from '~/composables'
import { useIsOnboardingActive } from '~/composables/onboarding/useIsOnboardingActive'
import useRunResultsReport from '~/composables/runResults/useRunResultsReport'
import useAutoPilotExplainable from '~/composables/useAutoPilotExplainable'
import { useBreakpoints } from '~/composables/useBreakPoints'
import useConfigFindings from '~/composables/useConfigFindings'
import { provideRequestError } from '~/helpers'
import { findingsLabel } from '~/helpers/getFindingsCrossNavigationString'
import { ROUTE_NAMES } from '~/router'
import { useConfigStore } from '~/store/useConfigStore'
import { useRelationStore } from '~/store/useRelationStore'
import { useRunStore } from '~/store/useRunStore'
import { storeContext, useApiCore, useApiNetworkError } from '~api'
import { EvaluationReport } from '~helpers'

const route = useRoute()
const { urlContext } = useUrlContext()
const runIdParam = computed(() =>
  route.name === ROUTE_NAMES.RUN_RESULTS ? Number(route.params.id) : undefined,
)

const showAutopilot = ref<EvaluationReport>()

const api = useApiCore()
const apiError = ref<string>()
useDebugMode({ errorState: apiError })

const breakpoints = useBreakpoints()

const runStore = useRunStore(storeContext)
const configStore = useConfigStore(storeContext)

const { isActive: isOnboardingActive } = useIsOnboardingActive()

const { findings, findingsAmount, getFindingsCount, fetchAllFindings } =
  useConfigFindings()

const showLogs = ref(false)
/** as outside click event listener toggle the showLogs first to hide the logs, it should be aborted by onShowLogsToggle in this case */
const toggleOnTime = ref(true)
/** reset the toggleOnTime to true after a toggle to false as the view update occured  */
watchEffect(() => {
  if (!toggleOnTime.value) setTimeout(() => (toggleOnTime.value = true), 1)
})
const onShowLogsToggle = (newVal: boolean) => {
  if (toggleOnTime.value) {
    showLogs.value = newVal
  }
  toggleOnTime.value = true
}
const run = computed(() =>
  runStore.runs.find((run) => run.id === runIdParam.value),
)
/** register the configuration to the user browsing history */
watchEffect(() => {
  if (run.value) useYakuBrowseHistory().push({ configId: run.value.configId })
})

const configOfRun = computed(() =>
  configStore.configs.find((c) => c.id === run.value?.configId),
)
watch(
  configOfRun,
  async (newVal) => {
    if (newVal) {
      await getFindingsCount(newVal.id.toString(), true)
      await fetchAllFindings(newVal.id.toString())
    }
  },
  { immediate: true },
)

/* ================
 *   Data fetching
 * ================= */

// ---- Fetch the run ----
// fetch the related run information
watch(
  [run, runIdParam],
  async ([newRun, id]) => {
    if (isOnboardingActive.value) return
    if (newRun?.log || id === undefined || isNaN(id)) return
    try {
      const r = await api.getRun({ runId: id })
      if (!r.ok) {
        apiError.value = await provideRequestError(r)
      } else {
        const newRun = (await r.json()) as GetRun
        runStore.push([newRun])
      }
    } catch (e) {
      apiError.value = useApiNetworkError()
    }
  },
  { immediate: true },
)

// ---- Fetch the configuration ----
// if the related configuration of the run is missing, then fetch it
watch(
  [configOfRun, run],
  async ([newVal, newRun]) => {
    if (!newRun || newVal) return
    const op = await configStore.getOrFetch(newRun.configId)
    if (!op.ok) {
      apiError.value = op.error.msg
    }
  },
  { immediate: true },
)

// load findings and save them to the store
const relationStore = useRelationStore()

watchEffect(async () => {
  if (!run.value) return
  const relatedConfig = configStore.getById(run.value.configId)
  if (!relatedConfig) return
  await getFindingsCount(relatedConfig.id.toString(), true)
  const runId = run.value.id.toString()
  relationStore.setSmartRelation({
    configuration: {
      id: relatedConfig.id.toString(),
      name: relatedConfig.name,
    },
    run: {
      id: runId.toString(),
    },
    findings: {
      label: findingsLabel(findingsAmount.value),
    },
  })
})
// --------------------
//  Download evidences
// --------------------
const isDownloadingEvidences = ref(false)
const onEvidencesDownload = async () => {
  isDownloadingEvidences.value = true
  await api.downloadEvidenceFile({
    runId: runIdParam.value!,
  })
  isDownloadingEvidences.value = false
}

const {
  toggleOpen,
  areOpen,
  currentChapters,
  currentContent,
  contentNavItems,
  report,
  reportStats,
  filterBy,
  useNewComponent,
  oldComponentContentNav,
} = useRunResultsReport()

const showNavigator = ref(false)
const navigatorPanelRef = ref<HTMLDivElement>()
onClickOutside(navigatorPanelRef, (event) => {
  event.stopPropagation()
  showNavigator.value = false
})
const removeEditorPanel = () => {
  if (!showNavigator.value) return
  showNavigator.value = false
}
addEventListener('resize', removeEditorPanel)
onUnmounted(() => removeEventListener('resize', removeEditorPanel))

/**
 * Explainable dialog
 */
const {
  show: showExplainableDialog,
  get,
  isLoading,
  explanation,
  apiError: aiError,
} = useAutoPilotExplainable()

/**
 * Layout
 */
const leftPanelWidth = ref<number>(400)
const maxLeftPanelWidth = ref<number>(600)
const leftPanelRef = ref<HTMLDivElement>()
const onLeftPanelResize = ({ clientX }: MouseEvent) => {
  if (!leftPanelRef.value) return
  const originX = leftPanelRef.value.getBoundingClientRect().x
  leftPanelWidth.value = Math.max(
    400,
    Math.min(clientX - originX, maxLeftPanelWidth.value),
  )
}
const { setResize: resizeLeftPanel, isResizing: isResizingLeftPanel } =
  useResizeDnD({
    onResize: onLeftPanelResize,
  })
const { width: windowWidth } = useWindowSize()

watch(windowWidth, (newWidth) => {
  if (newWidth && newWidth < 1440) {
    leftPanelWidth.value = 300
  }
})
</script>

<style scoped lang="scss">
@use '../../styles/mixins/resize-btn.scss' as ResizeBtn;

main {
  height: 100%;
  overflow: auto;
  padding: $viewPadding 0;
}

.run-results-view {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  // grid column layout similar to the app one
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: $viewPadding;

  >* {
    grid-column: 1 / span 12;

    @media screen and (min-width: $mdScreenWidth) {
      grid-column: 2 / span 10;
    }
  }

  &.resizing * {
    user-select: none;
    -webkit-user-select: none; // safari
  }

  .result-toolbar {
    grid-row: 1;
  }

  .result-header {
    grid-row: 2;
  }

  .content {
    position: relative;
    grid-row: 3;

    @media screen and (max-width: $bp-max-1020) {
      overflow-y: auto;
    }
  }

  &.resizing * {
    user-select: none;
    -webkit-user-select: none; // safari
  }
}

.report-container {
  border-right: 0.0625rem solid #EEEEEE; // grey-lighten-4
  position: relative;
  width: var(--left-panel-width);

  @media (max-width: $mdScreenWidth) {
    width: 100%;
    border: none;
  }

  .resize-btn {
    @include resize-btn;
    min-width: unset;
    width: unset !important;
    border-radius: 0;
    right: 0;

    @media (max-width: $mdScreenWidth) {
      display: none;
    }
  }
}

.content {
  display: grid;
  grid-template-columns: minmax(350px, auto) 1fr;
  gap: $space-section;

  .result-report {
    flex-grow: 1;
    overflow-y: auto;
    width: auto;
  }

  @media screen and (max-width: $bp-max-1020) {
    display: flex;
    flex-direction: column;

    section.result-report.report-block {
      overflow-y: unset;
    }
  }
}

.side-content {
  display: grid;
  grid-template-rows: minmax(0, auto) minmax(0, 1fr);
  grid-template-columns: auto; // set a fixed value because the chart is a fixed element
  row-gap: $space-section;
  width: var(--left-panel-width);
  max-width: var(--left-panel-width);


  >* {
    min-width: 100%;
  }

  @media screen and (max-width: $bp-max-1020) {
    display: flex;
    width: 100%;
    max-width: 100%;
  }

  .report-block {
    border-right: 0.0625rem solid #d0d4d8;
  }
}

@media (max-width: $mdScreenWidth) {
  .side-content {
    .report-block {
      border-right: none;
    }

    .resize-btn {
      display: none;
    }
  }
}

.report-block {
  padding: $space-component-l;
  display: flex;
  flex-direction: column;

}

nav.report-block {
  position: relative;

  .resize-btn {
    @include ResizeBtn.resize-btn;
    right: 0;
  }

  @media screen and (max-width: $bp-max-1020) {
    display: none;
  }
}

.requirement-headline {
  display: grid;
  grid-template-rows: 1fr auto; // the second row is for the reason of the manual check, if such exists.
  grid-template-columns: auto auto 1fr;
  padding: 12px 0;
  gap: 4px 8px;

  .reason {
    grid-row: 2 / 3;
    grid-column: 2 / 3;
  }
}

.check-table {
  width: 100%;

  tr:not(:first-child)::after {
    position: absolute;
    content: '';
    width: 100%;
    height: 0;
    left: 0;
    border-bottom: 0.0625rem solid #616161; // grey-darken-2
  }

  thead th {
    padding-top: 12px;
    padding-bottom: 16px;
  }

  thead th:nth-child(1),
  tbody td:nth-child(1),
  thead th:nth-child(2),
  tbody td:nth-child(2) {
    width: 3%;
    padding-right: 24px;
  }

  thead th:nth-child(3),
  tbody td:nth-child(3) {
    width: 14%;
  }

  thead th:nth-child(4),
  tbody td:nth-child(4) {
    width: 50%;
  }

  thead th:nth-child(5),
  tbody td:nth-child(5) {
    width: 30%;
  }

  td {
    vertical-align: top;
    padding: 8px 32px 8px 0;
    border: 1px solid transparent;

    &:nth-child(1),
    &:nth-child(2) {
      padding-right: 0;
    }

    &:nth-child(n+2),
    &:nth-child(n+2) li {
      font-size: 0.875rem;
    }

    &:nth-child(n+3) {
      color: #424242;
    }
  }
}

.-dark-mode {
  .run-results-view {
    background-color: #7d8389;
    --plain__enabled__front__default: #eff1f2;
    --integrated__enabled__front__default: #eff1f2;
  }
}

.comment-list {
  display: flex;
  flex-direction: column;
  row-gap: 0.5rem;

  li {
    word-break: break-word; // break the comments where possible
  }
}



.status-tooltip {
  height: 24px;
  --y-shift: -210%;
}



.logs-panel {
  top: calc(#{$headerHeight}); // header size
  min-width: 350px;
  width: 33%;

  --panel-height: calc(100vh - #{$headerHeight});
  height: var(--panel-height);
  max-height: var(--panel-height);
  border-top: none;
}

.nowrap {
  white-space: nowrap;
}

@media screen and (max-width: 1120px) {
  .toolbar-gap {
    :deep(.v-btn__content) {
      padding: 0;
      display: none;
    }
  }
}

.-from-sm {
  display: none;

  .editor-panel {
    width: var(--navigator-panel-width);
  }

  @media screen and (max-width: $bp-max-1020) {
    display: flex;
  }
}

:global(.m-popover.navigator-panel .m-popover__content) {
  max-width: 360px;
  height: 75vh;
}

:global(.m-popover.navigator-panel .editor-panel) {
  height: 100%;
  width: 100%;
  overflow-y: auto;
  scroll-behavior: smooth;
}
</style>
