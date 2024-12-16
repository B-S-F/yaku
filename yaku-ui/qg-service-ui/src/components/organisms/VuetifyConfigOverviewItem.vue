<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <VuetifyOverviewItemLayout :icon="pill ? undefined : 'mdi-wrench-outline'" :name="config.name"
    :description="config.description" :to="{
      name: ROUTE_NAMES.CONFIG_EDIT, params: { ...urlContext, id: `${config.id}` },
      query: { 'editor': editor }
    }">
    <template #pill>
      <VuetifyStatusPill v-if="pill" :arrowPlacementClass="'-top-left'" :title="pill.title" :color="pill.color"
        :tooltip="pill.tooltip">
        <template #icon>
          <FrogIcon v-if="pill.icon" :icon="pill.icon" />
          <component :is="pill.iconComponent" />
        </template>
      </VuetifyStatusPill>
    </template>
    <div>
      <RouterLink v-if="lastRun" class="yaku-info" :class="{ 'empty-link': !isFinished }"
        :to="isFinished ? { name: ROUTE_NAMES.RUN_RESULTS, params: { ...urlContext, id: lastRun.id } } : ''">
        <VuetifyRunStatus :state="lastRun" />
        <span>{{ lastRun.id }}</span>
      </RouterLink>
      <VuetifyConfigInfo v-else class="yaku-info empty-link" icon="mdi-play-outline" value="-" />
      <RouterLink class="yaku-info" :class="{ 'empty-link': !hasFinding }"
        :to="lastRun && hasFinding ? { name: ROUTE_NAMES.FINDINGS_OVERVIEW, params: urlContext, query: { configId: getConfigIdFromEndpoint(lastRun.config) } } : {}">
        <FrogIcon icon="mdi-file-document-outline" />
        <span v-if="hasFinding">{{ `${findingCount} Finding${(findingCount ?? 1) === 1 ? '' : 's'}` }}</span>
        <span v-else>-</span>
      </RouterLink>
    </div>
    <div>
      <VuetifyConfigInfo class="yaku-info" icon="mdi-link-variant"
        :value="`${getTotalFilesInConfig(config)} file${getTotalFilesInConfig(config) > 1 ? 's' : ''}`" />
      <VuetifyConfigInfo class="yaku-info" type="neutral" icon="mdi-calendar-clock-outline"
        :value="config.lastModificationTime ? useRecentDateFormat(new Date(config.lastModificationTime)) : '-'" />
    </div>
    <template #actions>
      <FrogPopover attached triggerOnHover tooltipAlike arrowPlacementClass="-without-arrow-top"
        :label="editConfigButtonData.label">
        <FrogButton primary :icon="editConfigButtonData.icon" data-cy="edit-button" />
      </FrogPopover>
      <FrogPopover attached triggerOnHover tooltipAlike arrowPlacementClass="-without-arrow-top"
        :label="copyConfigButtonData.label">
        <FrogButton tertiary :icon="copyConfigButtonData.icon" data-cy="copy-button"
          @click.prevent="copyConfigButtonData.onClick" />
      </FrogPopover>
      <FrogPopover attached triggerOnHover tooltipAlike arrowPlacementClass="-without-arrow-top"
        :label="startRunButtonData.label">
        <FrogButton tertiary :icon="startRunButtonData.icon" data-cy="run-button"
          @click.prevent="startRunButtonData.onClick" />
      </FrogPopover>
      <FrogPopover attached triggerOnHover tooltipAlike arrowPlacementClass="-without-arrow-top"
        :label="deleteButtonData.label">
        <FrogButton tertiary :icon="deleteButtonData.icon" data-cy="delete-button"
          @click.prevent="deleteButtonData.onClick" />
      </FrogPopover>
    </template>
    <template #secondary-actions>
      <FrogMenuItem :label="editConfigButtonData.label" :iconName="editConfigButtonData.icon" />
      <FrogMenuItem :label="copyConfigButtonData.label" :iconName="copyConfigButtonData.icon"
        @click.prevent="copyConfigButtonData.onClick" />
      <FrogMenuItem :label="startRunButtonData.label" :iconName="startRunButtonData.icon"
        @click.prevent="startRunButtonData.onClick" />
      <FrogMenuItem :label="deleteButtonData.label" :iconName="deleteButtonData.icon"
        @click.prevent="deleteButtonData.onClick" />
    </template>
  </VuetifyOverviewItemLayout>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useRecentDateFormat, useUrlContext } from '~/composables'
import { getConfigIdFromEndpoint } from '~/helpers'
import { ROUTE_NAMES } from '~/router'
import useUserProfileStore from '~/store/useUserProfileStore'
import type { Config, Run } from '~/types'

const props = defineProps<{
  config: Config
  lastRun?: Run | null
  findingCount?: number | undefined
}>()

const emit = defineEmits<{
  (e: 'start-run'): void
  (e: 'show-logs'): void
  (e: 'delete'): void
  (e: 'copy'): void
}>()

const userProfileStore = useUserProfileStore()
const { editor } = storeToRefs(userProfileStore).userProfile.value

const editConfigButtonData = {
  label: 'Edit configuration',
  icon: 'mdi-file-edit-outline',
  /** action handled by the OverviewItemLayout link */
  onClick: () => {},
}

const startRunButtonData = {
  label: 'Start a run',
  icon: 'mdi-play-outline',
  onClick: () => emit('start-run'),
}

const deleteButtonData = {
  label: 'Delete this configuration',
  icon: 'mdi-delete-outline',
  onClick: () => emit('delete'),
}

const copyConfigButtonData = {
  label: 'Copy this configuration',
  icon: 'mdi-file-document-multiple-outline',
  onClick: () => emit('copy'),
}

const { urlContext } = useUrlContext()

const hasFinding = computed(() => props.findingCount && props.findingCount > 0)
const isFinished = computed(
  () =>
    props.lastRun?.status === 'completed' || props.lastRun?.status === 'failed',
)
const getTotalFilesInConfig = ({ files }: Config) =>
  Number(!!files.qgConfig) +
  Number(!!files.qgAnswersSchema) +
  (files.additionalConfigs?.length ?? 0)

const pill = computed(() => {
  if (props.lastRun === null) {
    return {
      color: 'Unknown',
      tooltip: 'The configuration has not been executed yet.',
      icon: 'mdi-dots-horizontal-circle-outline',
    } as const
  }

  if (
    props.lastRun &&
    props.config.lastModificationTime > props.lastRun.creationTime
  ) {
    return {
      title: 'Out of sync',
      color: 'Info',
      tooltip: 'The configuration has changed since the last executed run.',
      icon: 'mdi-lightbulb-outline',
      iconComponent: undefined,
    } as const
  }
  return undefined
})
</script>

<style scoped lang="scss">
.edit-link {
  width: 3rem;
  height: 3rem;

  a {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0;
    height: 100%;
    width: 100%;

    :deep(i) {
      margin-right: 0;
    }
  }
}

a span:last-of-type:not(:first-of-type) {
  display: flex;
}
</style>
