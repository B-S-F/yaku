<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <VuetifyOverviewItemLayout :icon="pill ? undefined : 'mdi-play-outline'" :name="run.id.toString()"
    :to="areResultsAvailable ? { name: ROUTE_NAMES.RUN_RESULTS, params: { ...urlContext, id: run.id } } : undefined">
    <template #pill>
      <VuetifyStatusPill v-if="pill" :color="pill.color" :tooltip="pill.tooltip"
        :class="{ 'downloading': run.status === 'running' }">
        <template #icon>
          <FrogIcon v-if="pill.icon" :icon="pill.icon" />
          <component :is="pill.iconComponent" />
        </template>
      </VuetifyStatusPill>
    </template>
    <div class="run-overview-item-section">
      <RouterLink class="yaku-info" :to="{
        name: ROUTE_NAMES.CONFIG_EDIT, params: { ...urlContext, id: run.configId },
        query: { 'editor': editor }
      }">
        <FrogIcon class="text-body-2" icon="mdi-wrench-outline" />
        <span>{{ configName ?? '-' }}</span>
      </RouterLink>
      <RouterLink class="yaku-info" :class="{ 'empty-link': !findingCount }"
        :to="findingCount ? { name: ROUTE_NAMES.FINDINGS_OVERVIEW, params: urlContext, query: { configId: run.configId } } : {}">
        <FrogIcon class="text-body-2" icon="mdi-file-document-outline" />
        <span v-if="findingCount">{{ `${findingCount} Finding${(findingCount ?? 1) === 1 ? '' : 's'}` }}</span>
        <span v-else>-</span>
      </RouterLink>
    </div>
    <div class="run-overview-item-section">
      <VuetifyRuntimeClock class="yaku-info" :run="run" />
      <VuetifyConfigInfo class="yaku-info" type="neutral" icon="mdi-calendar-clock-outline"
        :value="run.creationTime ? useRecentDateFormat(new Date(run.creationTime)) : '-'" />
    </div>
    <FrogPopover class="result-overview" maxWidth="100vw" triggerOnHover attached tooltipAlike arrowPlacementClass="-without-arrow-top">
      <VuetifyRunResultOverview class="large-overview" v-bind="stats ?? {}" />
      <template #content>
        <VuetifyRunResultDescription :stats="stats" :noResultLabel="getNoResultLabel(run.status)" />
      </template>
    </FrogPopover>
    <template #actions>
      <FrogPopover attached triggerOnHover tooltipAlike arrowPlacementClass="-without-arrow-top"
        :label="openResultsButtonData.label">
        <FrogButton primary :icon="openResultsButtonData.icon" :disabled="openResultsButtonData.isDisabled"
          data-cy="open-results" />
      </FrogPopover>
      <FrogPopover attached triggerOnHover tooltipAlike arrowPlacementClass="-without-arrow-top"
        :label="isDownloadingEvidence ? evidenceButtonData.label : getEvidenceLabel(run.status)">
        <FrogButton secondary :class="evidenceButtonData.class" :icon="evidenceButtonData.icon"
          :disabled="evidenceButtonData.isDisabled" data-cy="evidence-button"
          @click.prevent="evidenceButtonData.onClick" />
      </FrogPopover>
      <FrogPopover attached triggerOnHover tooltipAlike arrowPlacementClass="-without-arrow-top"
        :label="logsButtonData.label">
        <FrogButton tertiary :icon="logsButtonData.icon" :disabled="logsButtonData.isDisabled" data-cy="logs-button"
          @click.prevent="logsButtonData.onClick" />
      </FrogPopover>
      <FrogPopover attached triggerOnHover tooltipAlike arrowPlacementClass="-without-arrow-top"
        :label="deleteButtonData.label">
        <FrogButton tertiary :icon="deleteButtonData.icon" data-cy="delete-button"
          @click.prevent="deleteButtonData.onClick" />
      </FrogPopover>
    </template>
    <template #secondary-actions>
      <FrogMenuItem class="bg-blue" :label="openResultsButtonData.label" :iconName="openResultsButtonData.icon"
        :isDisabled="openResultsButtonData.isDisabled" />
      <FrogMenuItem :class="evidenceButtonData.class" :label="evidenceButtonData.label"
        :iconName="evidenceButtonData.icon" :isDisabled="evidenceButtonData.isDisabled"
        @click.prevent="evidenceButtonData.onClick" />
      <FrogMenuItem :label="logsButtonData.label" :iconName="logsButtonData.icon"
        :isDisabled="logsButtonData.isDisabled" @click.prevent="logsButtonData.onClick" />
      <FrogMenuItem :label="deleteButtonData.label" :iconName="deleteButtonData.icon"
        @click.prevent="deleteButtonData.onClick" />
    </template>
  </VuetifyOverviewItemLayout>
</template>

<script setup lang="ts">
import { useAsyncState } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, watch } from 'vue'
import {
  areRunLogsAvailable,
  areRunResultsAvailable,
  convertRunResultToReport,
  getVuetifyRunPillInfo,
} from '~/helpers'
import { ROUTE_NAMES } from '~/router'
import { useReportStore } from '~/store/useReportStore'
import useUserProfileStore from '~/store/useUserProfileStore'
import type { LocalRun, Run, StatusPillDisplay } from '~/types'
import { storeContext } from '~api'
import {
  useRecentDateFormat,
  useReportStats,
  useUrlContext,
} from '~composables'

const props = defineProps<{
  configName?: string
  run: LocalRun
  findingCount?: number
  isDownloadingEvidence?: boolean
}>()

const emit = defineEmits<{
  (e: 'show-log', run: LocalRun): void
  (e: 'download-evidences', run: LocalRun): void
  (e: 'delete', run: LocalRun): void
}>()

const { urlContext } = useUrlContext()
const userProfileStore = useUserProfileStore()
const { editor } = storeToRefs(userProfileStore).userProfile.value

const areResultsAvailable = computed(() => areRunResultsAvailable(props.run))
const areLogsAvailable = computed(() => areRunLogsAvailable(props.run))

const openResultsButtonData = computed(() => ({
  // no click event handler because it is handled by the OverviewItemLayout link
  label: areResultsAvailable.value
    ? 'Show results'
    : getResultLabel(props.run.status),
  icon: 'mdi-file-document-multiple-outline',
  isDisabled: !areResultsAvailable.value,
}))

const evidenceButtonData = computed(() =>
  props.isDownloadingEvidence
    ? {
        label: 'Downloading...',
        icon: 'mdi-download-lock-outline',
        class: '',
      }
    : {
        label: getEvidenceLabel(props.run.status),
        icon: 'mdi-download-outline',
        onClick: () => emit('download-evidences', props.run),
        isDisabled: !areResultsAvailable.value,
      },
)

const logsButtonData = computed(() => ({
  label: areLogsAvailable.value ? 'Open logs' : 'No logs are available yet.',
  icon: 'mdi-text-box-search-outline',
  onClick: () => emit('show-log', props.run),
  isDisabled: !areLogsAvailable.value,
}))

const deleteButtonData = {
  label: 'Delete run',
  icon: 'mdi-trash-can-outline',
  onClick: () => emit('delete', props.run),
}

const getEvidenceLabel = (status: Run['status']): string => {
  if (status === 'running') return 'No evidences are available yet.'
  if (status === 'failed')
    return 'No evidences are available since the run failed.'
  return 'Download evidences'
}

const getResultLabel = (status: Run['status']): string => {
  if (status === 'running')
    return 'Result will be available when the run has been completed'
  if (status === 'failed') return 'No result available for failed runs'
  return 'Open results'
}

const getNoResultLabel = (status: Run['status']): string => {
  if (status === 'running') return 'There are no results yet.'
  if (status === 'pending') return 'No results - checks are pending'
  return 'No results available'
}

const reportStore = useReportStore(storeContext)
const { state: stats, execute: prepareStats } = useAsyncState(
  async () => {
    const { status, overallResult } = props.run
    const isPending =
      status === 'pending' ||
      (status === 'completed' && overallResult === 'PENDING')
    if (status === 'failed' || isPending)
      return { green: 0, yellow: 0, red: 0, na: 0, unanswered: 0, manual: 0 }
    else {
      const { ok, resource } = await reportStore.getReport(props.run.id)
      if (!ok) return
      const report = convertRunResultToReport(resource)?.report
      if (!report) return
      const { answered, results } = useReportStats({ report })
      const { manual } = answered

      return {
        green: results.GREEN,
        yellow: results.YELLOW,
        red: results.RED,
        na: results.NA,
        unanswered: results.UNANSWERED,
        manual,
      }
    }
  },
  undefined,
  { immediate: false },
)

watch(
  () => props.run,
  (newVal) => {
    if (newVal.status !== 'running') prepareStats()
  },
  { immediate: true },
)

const pill = computed<StatusPillDisplay>(() => getVuetifyRunPillInfo(props.run))
</script>

<style scoped lang="scss">
@use '../../styles/tokens.scss' as *;

.heading {
  margin: 0;
  width: fit-content;
  text-overflow: ellipsis;
}

.header-date {
  flex-grow: 1;
  justify-content: flex-end;
  white-space: nowrap;
}

// ------------------------------------------
.result-overview {
  width: 50px;

  --y-shift: calc(-100% - 12px);

  .large-overview:deep(>*:not(.v-icon)) {
    display: none
  }
}

@media screen and (min-width: $bp-max-820) {
  .result-overview {
    width: 150px;

    .large-overview:deep(>*:not(.v-icon)) {
      display: block;
    }
  }
}
</style>
