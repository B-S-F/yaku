<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <VuetifyDashboardTile heading="Increased Quality" :isEmpty="findings.length === 0">
    <VuetifyRelationGrid :items="findings" itemKey="runId">
      <template #configuration-column="{ item: finding }">
        <RouterLink class="aqua-link config-name" :to="{
          name: ROUTE_NAMES.CONFIG_EDIT, params: { ...urlContext, id: finding.configId },
          query: { 'editor': editor }
        }">
          <FrogIcon icon="mdi-wrench-outline" />
          <span v-if="relatedConfigs[finding.configId]">{{ relatedConfigs[finding.configId].name }}</span>
        </RouterLink>
      </template>

      <template #run-column="{ item: finding }">
        <RouterLink class="aqua-link"
          :to="{ name: ROUTE_NAMES.RUN_RESULTS, params: { ...urlContext, id: finding.runId } }">
          <FrogIcon icon="mdi-play-outline" />
          <span>{{ finding.runId }}</span>
        </RouterLink>
      </template>

      <template #finding-column="{ item: finding }">
        <div class="chip-group">
          <component :is="Number(finding.count) > 0 ? 'RouterLink' : 'div'" class="chip transparent-link"
            :to="Number(finding.count) > 0 ? { name: ROUTE_NAMES.FINDINGS_OVERVIEW, params: urlContext, query: { configId: finding.configId } } : undefined">
            <FrogIcon icon="mdi-file-document-check-outline" />
            <span>{{ finding.count }}</span>
          </component>
          <RouterLink class="transparent-link"
            :to="{ name: ROUTE_NAMES.FINDINGS_OVERVIEW, params: urlContext, query: { configId: finding.configId } }">
            <VuetifyDeltaPill :delta="Number(finding.diff)" />
          </RouterLink>
        </div>
      </template>
    </VuetifyRelationGrid>
    <template #empty>
      <VuetifyEmptyTileContent type="success" label="There are currently no configurations with increased quality" />
    </template>
  </VuetifyDashboardTile>
</template>

<script setup lang="ts">
import type { Config } from '~/types'
import type { FindingMetric, GetFindingMetric } from '~/api'
import { onMounted, ref } from 'vue'
import { storeContext, useApiMetrics } from '~/composables/api'
import { ROUTE_NAMES } from '~/router'
import { useUrlContext } from '~/composables'
import { useConfigStore } from '~/store/useConfigStore'
import { uniqueBy } from '~utils'
import useUserProfileStore from '~/store/useUserProfileStore'
import { storeToRefs } from 'pinia'

const apiMetrics = useApiMetrics()
const { urlContext } = useUrlContext()

const userProfileStore = useUserProfileStore()
const { editor } = storeToRefs(userProfileStore).userProfile.value
const configStore = useConfigStore(storeContext)
const findings = ref<FindingMetric[]>([])
const relatedConfigs = ref<Record<FindingMetric['configId'], Config>>({})

const populate = async () => {
  let hasNext = true
  let page = 1
  const res: FindingMetric[] = []
  while (findings.value.length < 3 && hasNext) {
    // note that the run ID returned is not especially the last one if two runs of a config have the same findings count
    await apiMetrics
      .getLatestRunFindings({
        items: 20,
        sortBy: 'diff',
        page,
        sortOrder: 'ASC',
      })
      .then(async (r) => {
        const { links, data } = (await r.json()) as GetFindingMetric
        const allowedData = data.filter((v) => Number(v.diff) < 0)
        hasNext = !!links.next && allowedData.length === data.length
        const uniqueFindingsPerConfig = uniqueBy(allowedData, 'configId')
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
.chip-group {
  display: flex;
  gap: $space-component-l;
}

.chip {
  display: flex;
  align-items: center;
  border-radius: 16px;
  padding: $padding-component-xxs $padding-component-m $padding-component-xxs $padding-component-xs;
  width: fit-content;
  // FIXME: hardcoded color
  background-color: #e0e2e5;
}

.transparent-link {
  text-decoration: none;
}

.config-name span {
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
