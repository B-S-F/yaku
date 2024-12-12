<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <VuetifyOverviewItemLayout class="finding-item" :description="finding.metadata?.description"
    :name="quickHtmlTagStrip(formatMdContent(finding.metadata?.name ?? finding.criterion, { type: 'inline' }))"
    :icon="pill ? undefined : 'mdi-file-check-outline'"
    :to="{ name: 'FindingsResults', params: { ...urlContext, id: finding.id } }">
    <template #pill>
      <VuetifyStatusPill v-if="pill" :color="pill.color" :tooltip="pill.tooltip" :title="pill.label">
        <template #icon>
          <FrogIcon v-if="pill.icon" :icon="pill.icon" />
          <component :is="pill.iconComponent" />
        </template>
      </VuetifyStatusPill>
    </template>
    <div>
      <!-- config link -->
      <RouterLink v-if="finding.configId && configName" class="yaku-info" :to="{
        name: ROUTE_NAMES.CONFIG_EDIT,
        params: { ...urlContext, id: finding.configId }
      }">
        <VuetifyConfigInfo icon="mdi-wrench-outline" :value="configName" />
      </RouterLink>
      <VuetifyConfigInfo v-else class="yaku-info" icon="mdi-wrench-outline" value="N/A" />
      <!-- run link -->
      <RouterLink v-if="finding.runId" class="yaku-info no-color" :to="{
        name: ROUTE_NAMES.RUN_RESULTS,
        params: { ...urlContext, id: finding.runId }
      }">
        <VuetifyConfigInfo class="yaku-info" icon="mdi-play-outline" :value="finding.runId" />
      </RouterLink>
      <VuetifyConfigInfo v-else class="yaku-info" icon="mdi-play-outline" label="Last Run:" value="-" />
    </div>
    <div>
      <!-- date -->
      <VuetifyConfigInfo class="yaku-info" icon="mdi-calendar-clock-outline"
        :value="useRecentDateFormat(new Date(finding.updatedAt))" />
      <VuetifyConfigInfo class="yaku-info" icon="mdi-history" :value="finding.occurrenceCount" />
    </div>
    <template #actions>
      <FrogPopover attached triggerOnHover tooltipAlike arrowPlacementClass="-without-arrow-top"
        :label="openDetailButton.label">
        <FrogButton primary :icon="openDetailButton.icon" data-cy="show-detail" />
      </FrogPopover>
    </template>
  </VuetifyOverviewItemLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getVuetifyFindingStatusPill } from '~/helpers'
import { isAutoResolved } from '~/helpers/checkResolversName'
import { ROUTE_NAMES } from '~/router'
import type { Finding } from '~/types'
import { useRecentDateFormat, useUrlContext } from '~composables'
import { formatMdContent, quickHtmlTagStrip } from '~utils'

const props = defineProps<{
  finding: Finding
  configName: string | null
}>()

const { urlContext } = useUrlContext()

const pill = computed(() =>
  getVuetifyFindingStatusPill(
    props.finding.status,
    isAutoResolved(props.finding.resolver),
  ),
)

const openDetailButton = {
  label: 'Open details',
  icon: 'mdi-checkbox-multiple-marked',
  // on click event handler is the link of OverviewItemLayout
}
</script>

<style scoped lang="scss">
.-dark-mode .finding-item {
  color: #EEEEEE;
}

a span.yaku-info {
  display: flex;
}

.yaku-info:not(.no-color) {

  :deep(i),
  :deep(svg) {
    color: var(--icon-color);
  }
}

.small-detail {
  max-width: 100px;
}
</style>
