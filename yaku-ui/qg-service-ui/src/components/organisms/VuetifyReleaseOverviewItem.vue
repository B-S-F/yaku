<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <VuetifyOverviewItemLayout :name="release.name" :hasSecondPill="release.closed"
    :to="{ name: ROUTE_NAMES.RELEASE_DETAILS_CHECKS, params: { ...urlContext, id: release.id } }">
    <template #pill>
      <VuetifyStatusPill v-if="pill" arrowPlacementClass="-without-arrow-top" :color="pill.color" :tooltip="pill.tooltip">
        <template #icon>
          <FrogIcon v-if="!pill.iconComponent" :icon="pill.icon ?? ''" />
          <component :is="pill.iconComponent" v-else />
        </template>
      </VuetifyStatusPill>
    </template>
    <template #second-pill>
      <VuetifyStatusPill v-if="release.closed" arrowPlacementClass="-without-arrow-top" :color="secondPill.color" :tooltip="secondPill.tooltip">
        <template #icon>
          <FrogIcon v-if="secondPill.icon" :icon="secondPill.icon" />
        </template>
      </VuetifyStatusPill>
    </template>
    <div>
      <RouterLink :to="{
    name: ROUTE_NAMES.CONFIG_EDIT,
    params: {
      ...urlContext,
      id: release.qgConfigId
    },
    query: { 'editor': editor }
  }" class="yaku-info" :class="{ 'empty-link': !release.qgConfigId }">
        <FrogIcon icon="mdi-wrench-outline" />
        <span>{{ displayConfigs }}</span>
      </RouterLink>
    </div>
    <div class="no-border-left">
      <RouterLink :to="release.lastRunId ? {
    name: ROUTE_NAMES.RUN_RESULTS,
    params: {
      ...urlContext,
      id: release.lastRunId,
    }
  } : {}" class="yaku-info" :class="{ 'empty-link': !displayLastRun }">
        <FrogIcon icon="mdi-play-outline" />
        <span>{{ displayLastRun }}</span>
      </RouterLink>
      <RouterLink :to="displayFindings && config ? { name: ROUTE_NAMES.FINDINGS_OVERVIEW, params: urlContext, query: { configId: getConfigIdFromEndpoint(String(release.qgConfigId)) } } : {}
    " class="yaku-info" :class="{ 'empty-link': !displayFindings }">
        <FrogIcon icon="mdi-file-document-check-outline" />
        <span>{{ displayFindings }}</span>
      </RouterLink>
    </div>
    <div>
      <VuetifyConfigInfo class="yaku-info" icon="mdi-account-check-outline" :value="displayReleaseApprovers" />
      <VuetifyConfigInfo class="yaku-info" icon="mdi-calendar-clock-outline" :value="displayPlannedRelease" />
    </div>
    <template #actions>
      <FrogButton primary icon="mdi-clipboard-check-multiple-outline" />
      <FrogButton tertiary icon="mdi-trash-can-outline" @click.prevent="emit('delete')" />
    </template>
    <template #secondary-actions>
      <FrogMenuItem label="delete" iconName="mdi-trash-can-outline" @click.prevent="emit('delete')" />
    </template>
  </VuetifyOverviewItemLayout>
</template>
<script setup lang="ts">
import type { Release } from '~/types/Release'
import { computed, onMounted } from 'vue'
import { getHumanDateTime, pluralize } from '~/utils'
import { ROUTE_NAMES } from '~/router'
import { useUrlContext } from '~/composables'
import { StatusPillDisplay } from '~/types'
import { useReleaseFetcher } from '~/composables/fetcher/useReleaseDetailsFetcher'
import {
  getConfigIdFromEndpoint,
  getVuetifyReleaseStatusPillInfo,
} from '~/helpers'
import { displayUserName } from '~/helpers/displayUserName'
import useUserProfileStore from '~/store/useUserProfileStore'
import { storeToRefs } from 'pinia'

const props = defineProps<{
  release: Release
  config?: string
  findingsCount?: number
}>()

const emit = defineEmits<(e: 'delete') => void>()

const { urlContext } = useUrlContext()

// We can not destructure the `props` object directly without loosing the reactivity.
const release = computed(() => props.release)

const displayConfigs = computed(() => (props.config ? props.config : '-'))
const displayFindings = computed(() =>
  props.findingsCount
    ? `${props.findingsCount} Finding${pluralize(props.findingsCount)}`
    : '-',
)
const displayLastRun = computed(() =>
  props.release.lastRunId ? `${props.release.lastRunId}` : '-',
)
const displayPlannedRelease = computed(() =>
  release.value.plannedDate ? getHumanDateTime(release.value.plannedDate) : '',
)
const displayReleaseApprovers = computed(() =>
  releaseApprovers.value && releaseApprovers.value.length
    ? releaseApprovers.value.map((a) => displayUserName(a.user)).join(', ')
    : '-',
)

const { releaseApprovers, fetchAllApproversState } = useReleaseFetcher({
  id: props.release.id,
})

onMounted(async () => {
  await fetchAllApproversState()
})

// status pill
const pill = computed<StatusPillDisplay>(() => {
  if (props.release.approvalState === 'approved') {
    return {
      color: 'Success',
      label: 'Approved',
      tooltip: 'Release is approved.',
      icon: 'mdi-check-circle-outline',
      iconComponent: undefined,
    }
  }
  return {
    color: 'Unknown',
    label: 'Pending',
    tooltip: 'Approver state is pending.',
    icon: 'mdi-dots-horizontal-circle-outline',
    iconComponent: undefined,
  }
})

const secondPill: StatusPillDisplay = getVuetifyReleaseStatusPillInfo('closed')

const userProfileStore = useUserProfileStore()
const { editor } = storeToRefs(userProfileStore).userProfile.value
</script>
<style lang="scss" scoped>
.no-border-left {
  border-left: 0;
}

.pill.pill-closed.rounded {
  gap: 8px;
  padding: 4px 16px 4px 8px;
}
</style>
