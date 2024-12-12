<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <VuetifyDashboardTile heading="Last Opened" :isEmpty="history.length === 0">
    <VuetifyRelationGrid :items="history" itemKey="configId">
      <template #configuration-column="{ item }">
        <RouterLink class="aqua-link config-name" :to="{
          name: ROUTE_NAMES.CONFIG_EDIT, params: { ...urlContext, id: item.configId },
          query: { 'editor': editor }
        }">
          <FrogIcon icon="mdi-wrench-outline" />
          <span v-if="configurations[item.configId]">{{ configurations[item.configId].name }}</span>
        </RouterLink>
      </template>

      <template #run-column="{ item }">
        <RouterLink v-if="runs[item.configId]" class="aqua-link"
          :to="{ name: ROUTE_NAMES.RUN_RESULTS, params: { ...urlContext, id: runs[item.configId]?.id } }">
          <FrogIcon icon="mdi-play-outline" />
          <span>{{ runs[item.configId]?.id }}</span>
        </RouterLink>
      </template>

      <template #finding-column="{ item }">
        <component :is="findingsCount[item.configId] && findingsCount[item.configId] !== 0 ? 'RouterLink' : 'div'"
          class="chip"
          :to="findingsCount[item.configId] ? { name: ROUTE_NAMES.FINDINGS_OVERVIEW, params: urlContext, query: { configId: item.configId } } : undefined">
          <FrogIcon icon="mdi-file-document-check-outline" />
          <span>{{ findingsCount[item.configId]?.toString() ?? 'N/A' }}</span>
        </component>
      </template>
    </VuetifyRelationGrid>
    <template #empty>
      <VuetifyEmptyTileContent type="info" label="No items have been opened recently" />
    </template>
  </VuetifyDashboardTile>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref, watchEffect } from 'vue'
import type { GetFindingMetric } from '~/api'
import { storeContext, useApiMetrics } from '~/composables/api'
import { ROUTE_NAMES } from '~/router'
import { useConfigStore } from '~/store/useConfigStore'
import { useRunStore } from '~/store/useRunStore'
import useUserProfileStore from '~/store/useUserProfileStore'
import type { Config, Run } from '~/types'
import { useUrlContext, useYakuBrowseHistory } from '~composables'

const userProfileStore = useUserProfileStore()
const { editor } = storeToRefs(userProfileStore).userProfile.value
const configStore = useConfigStore(storeContext)
const runStore = useRunStore(storeContext)
const apiMetrics = useApiMetrics()

const { urlContext } = useUrlContext()

const { history } = useYakuBrowseHistory()

const configurations = ref<Record<Config['id'], Config>>({})
/** populate the configurations depending of the browsing history */
watchEffect(async () => {
  history.value.forEach(async (v) => {
    // populate the configuration
    const op = await configStore.getOrFetch(v.configId)
    const config = op.resource
    if (!config) return
    configurations.value[config.id] = config

    // populate the related finding count
    apiMetrics
      .getFindings({ configId: config.id, items: 1 })
      .then(async (r) => {
        if (r.ok) {
          const { data } = (await r.json()) as GetFindingMetric
          const lastFindingMetric = data.at(0)
          findingsCount.value[config.id] =
            lastFindingMetric !== undefined
              ? Number(lastFindingMetric.count)
              : undefined
        }
      })
      .catch(console.error)
  })
})

const runs = ref<Record<Config['id'], Run | undefined>>({})
/** populate the last run based on the configurations */
watchEffect(() => {
  Object.values(configurations.value).map(async (config) => {
    const op = await runStore.getOrFetchLastRun(config.id)
    runs.value[config.id] = op.resource
  })
})

const findingsCount = ref<Record<Config['id'], number | undefined>>({})
</script>

<style scoped lang="scss">
.chip {
  display: flex;
  align-items: center;
  border-radius: 16px;
  width: fit-content;
  padding: $padding-component-xxs $padding-component-m $padding-component-xxs $padding-component-xxs;
  // FIXME: hardcoded color
  background-color: #e0e2e5;

  .v-icon {
    margin-right: $space-chip;
  }
}

a.chip {
  text-decoration: none;
}

.config-name span {
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
