<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <VuetifyDashboardTile heading="Most Findings" :isEmpty="findings.length === 0">
    <VuetifyRelationGrid :items="findings" itemKey="datetime">
      <template #configuration-column="{ item }">
        <RouterLink class="aqua-link config-name" :to="{
          name: ROUTE_NAMES.CONFIG_EDIT, params: { ...urlContext, id: item.configId },
          query: { 'editor': editor }
        }">
          <FrogIcon icon="mdi-wrench-outline" />
          <span v-if="relatedConfigs[item.configId]">{{ relatedConfigs[item.configId].name }}</span>
        </RouterLink>
      </template>

      <template #run-column="{ item }">
        <RouterLink class="aqua-link"
          :to="{ name: ROUTE_NAMES.RUN_RESULTS, params: { ...urlContext, id: item.runId } }">
          <FrogIcon icon="mdi-play-outline" />
          <span>{{ item.runId }}</span>
        </RouterLink>
      </template>

      <template #finding-column="{ item }">
        <component :is="Number(item.count) > 0 ? 'RouterLink' : 'div'" class="chip"
          :to="Number(item.count) > 0 ? { name: ROUTE_NAMES.FINDINGS_OVERVIEW, params: urlContext, query: { configId: item.configId } } : undefined">
          <FrogIcon icon="mdi-file-document-check-outline" />
          <span>{{ item.count }}</span>
        </component>
      </template>
    </VuetifyRelationGrid>
    <template #empty>
      <VuetifyEmptyTileContent type="info" label="There are no configurations with most findings" />
    </template>
  </VuetifyDashboardTile>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { onMounted, ref } from 'vue'
import type { FindingMetric, GetFindingMetric } from '~/api'
import { storeContext, useApiMetrics } from '~/composables/api'
import { ROUTE_NAMES } from '~/router'
import { useConfigStore } from '~/store/useConfigStore'
import useUserProfileStore from '~/store/useUserProfileStore'
import type { Config } from '~/types'
import { useUrlContext } from '~composables'
import { uniqueBy } from '~utils'

const userProfileStore = useUserProfileStore()
const { editor } = storeToRefs(userProfileStore).userProfile.value
const apiMetrics = useApiMetrics()
const configStore = useConfigStore(storeContext)
const { urlContext } = useUrlContext()

const findings = ref<FindingMetric[]>([])
const relatedConfigs = ref<Record<FindingMetric['configId'], Config>>({})

const populate = async () => {
  let hasNext = true
  let page = 1
  const res: FindingMetric[] = []
  while (findings.value.length < 3 && hasNext) {
    // note that the run ID returned is not especially the last one if two runs of a config have the same findings count
    await apiMetrics
      .getLatestRunFindings({ items: 20, sortBy: 'count', page })
      .then(async (r) => {
        const { links, data } = (await r.json()) as GetFindingMetric
        hasNext = !!links.next
        const uniqueFindingsPerConfig = uniqueBy(data, 'configId')
        const newFindings = uniqueFindingsPerConfig.filter(
          (d) => !findings.value.find((f) => f.configId === d.configId),
        )
        res.push(...newFindings)
      })
      .catch((e) => {
        console.error(e)
        hasNext = false
      })
      .finally(() => {
        page += 1
      })
  }
  return Promise.resolve(res)
}
onMounted(async () => {
  populate().then(async (res) => {
    res.forEach(async (f) => {
      const op = await configStore.getOrFetch(Number(f.configId))
      if (op.ok) {
        relatedConfigs.value[f.configId] = op.resource
        findings.value.push(f)
      }
    })
  })
})
</script>

<style scoped lang="scss">
.chip {
  display: flex;
  align-items: center;
  width: fit-content;
  border-radius: 16px;
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
