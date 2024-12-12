<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <VuetifyDashboardTile class="performance-tile" heading="Performance">
    <template #before-context-menu>
      <FrogDropdown id="configuration" v-model="selectedConfigItem" class="configuration-field" label="Configuration"
        :items="configItems" />
      <FrogDropdown id="timerange" v-model="selectedTimerangeItem" class="configuration-field" label="Timerange"
        :items="TIMERANGE_ITEMS" />
    </template>
    <template #default>
      <template v-if="tileState === 'idle'">
        <VuetifyPerformanceChart v-if="dataPoints.length > 0 && chartRange" :points="dataPoints" :range="chartRange"
          :mode="chartMode" @hover-point="onHoverPoint" />
        <VuetifyStack v-else v-slot="{ visibleClass }" class="tile-content --empty">
          <p class="empty-state-label" :class="visibleClass">
            No runs available to calculate the performance over time.
          </p>
          <VuetifyEmptyState2 class="empty-state-illustration" :class="visibleClass" style="" />
        </VuetifyStack>
      </template>
      <div v-else-if="tileState === 'loading'" class="tile-content">
        <FrogActivityIndicator type="large" />
      </div>

      <Teleport to="#app">
        <dialog v-if="showTooltipWith" :open="!!showTooltipWith"
          class="dialog-reset performance-tooltip bg-background pa-4 elevation-2">
          <h1 class="text-h6 font-weight-bold">
            Number of findings
          </h1>
          <div class="info">
            <span class="font-weight-bold">
              {{ Number(showTooltipWith.diff) > 0 ? 'Findings increased' : Number(showTooltipWith.diff) < 0
                ? 'Findings decreased' : 'Findings stabilized' }} </span>
                <VuetifyDeltaPill :delta="Number(showTooltipWith.diff)" />
          </div>
          <div class="info">
            <span class="font-weight-bold">Date</span>
            <span>{{ formatDateToCET(showTooltipWith.datetime) }}</span>
          </div>
        </dialog>
      </Teleport>
    </template>
  </VuetifyDashboardTile>
</template>

<script setup lang="ts">
import type { SelectItem } from '@B-S-F/frog-vue'
import { useLocalStorage } from '@vueuse/core'
import type { ActiveElement } from 'chart.js'
import { computed, ref, watch } from 'vue'
import type { FindingMetric, GetFindingMetric } from '~/api'
import { storeContext, useApiMetrics } from '~/composables/api'
import { TILE } from '~/config/dashboard'
import type { Config } from '~/types'
import { formatDateToCET, getLastDays, getLastMonths } from '~/utils'
import { getStoreKey } from '~helpers'

const props = defineProps<{
  configItems: SelectItem<Config['id']>[]
}>()

const CONFIG_STORAGE_KEY = `${TILE.PERFORMANCE}-config`
const configIdStorage = useLocalStorage<string | null>(
  getStoreKey(CONFIG_STORAGE_KEY, storeContext),
  null,
  { listenToStorageChanges: false },
) // urlSearchParams[CONFIG_URL_KEY] ? Number(urlSearchParams[CONFIG_URL_KEY]) : undefined
const selectedConfigItem = ref<SelectItem<Config['id']>>()
/** init the selected configuration */
watch([props, configIdStorage], ([{ configItems }, selectedId]) => {
  if (!configItems || configIdStorage === undefined) return
  const selectionFromStorage = configItems.find(
    (c) => c.value === Number(selectedId),
  )
  const defaultSelection = configItems.at(0)
  selectedConfigItem.value = selectionFromStorage
    ? selectionFromStorage
    : defaultSelection
})
watch(selectedConfigItem, (config, oldConfig) => {
  if (typeof config === 'undefined' || config === oldConfig) return
  configIdStorage.value = config.value.toString()
})

const TIMERANGE_ITEMS: SelectItem<number>[] = [
  { value: 7, label: 'Last 7 days' },
  { value: 1, label: 'Last month' },
  { value: 3, label: 'Last 3 months' },
  { value: 6, label: 'Last 6 months' },
  { value: 12, label: 'Last 12 months' },
]
const TIMERANGE_STORAGE_KEY = `${TILE.PERFORMANCE}-timerange`
const timerangeIdStorage = useLocalStorage<string | null>(
  getStoreKey(TIMERANGE_STORAGE_KEY, storeContext),
  null,
  { listenToStorageChanges: false },
) // urlSearchParams[CONFIG_URL_KEY] ? Number(urlSearchParams[CONFIG_URL_KEY]) : undefined
const selectedTimerangeItem = ref<SelectItem<number>>()
watch([props, timerangeIdStorage], ([{ configItems }, selectedId]) => {
  if (!configItems || timerangeIdStorage === undefined) return
  const selectionFromStorage = TIMERANGE_ITEMS.find(
    (t) => t.value === Number(selectedId),
  )
  const defaultSelection = TIMERANGE_ITEMS[0]
  selectedTimerangeItem.value = selectionFromStorage
    ? selectionFromStorage
    : defaultSelection
})
watch(selectedTimerangeItem, (timerange, oldTImerange) => {
  if (!timerange || timerange.value === oldTImerange?.value) return
  timerangeIdStorage.value = timerange.value.toString()
})

const chartMode = computed(() => {
  if (selectedTimerangeItem.value?.value === 7) return 'week'
  if (selectedTimerangeItem.value?.value === 1) return 'month'
  if (selectedTimerangeItem.value?.value === 3) return 'quarter'
  if (selectedTimerangeItem.value?.value === 6) return 'half'
  if (selectedTimerangeItem.value?.value === 12) return 'year'
  return undefined
})
const chartRange = computed<[Date, Date] | undefined>(() =>
  selectedTimerangeItem.value
    ? [
        selectedTimerangeItem.value.label.includes('month')
          ? getLastMonths(selectedTimerangeItem.value?.value)
          : getLastDays(selectedTimerangeItem.value?.value),
        new Date(),
      ]
    : undefined,
)
const dataPoints = ref<{ x: Date; y: number }[]>([])
const findings = ref<FindingMetric[]>([])

const apiMetrics = useApiMetrics()
const tileState = ref<'idle' | 'loading'>('loading')

watch(
  [selectedConfigItem, chartRange],
  ([newConfigSelection, chartRange]) => {
    if (!newConfigSelection || !chartRange) return
    tileState.value = 'loading'
    const [startRange, endRange] = chartRange
    apiMetrics
      .getFindingsInRange({
        items: 100,
        startRange,
        endRange,
        configId: newConfigSelection.value,
      })
      .then(async (r) => {
        if (r.ok) {
          const { data } = (await r.json()) as GetFindingMetric
          findings.value = data
          dataPoints.value = data.map((finding) => ({
            x: new Date(finding.datetime),
            y: Number(finding.count),
          }))
        }
      })
      .catch(console.error)
      .finally(() => {
        tileState.value = 'idle'
      })
  },
  { immediate: true },
)

const showTooltipWith = ref<
  (FindingMetric & { x: number; y: number }) | undefined
>()
const tooltipX = computed(() => `${showTooltipWith.value?.x}px`)
const tooltipY = computed(() => `${showTooltipWith.value?.y}px`)
const onHoverPoint = (
  payload:
    | {
        canvas: HTMLCanvasElement | undefined
        element: ActiveElement
        point: { x: Date; y: number }
      }
    | undefined,
) => {
  if (!payload) {
    showTooltipWith.value = undefined
  } else {
    const { canvas, element, point } = payload
    const isFindingMatchingPointFactory = (
      point: (typeof payload)['point'],
    ) => {
      const p = { x: point.x.toISOString(), y: point.y.toString() }
      return (f: FindingMetric) => f.count === p.y && f.datetime === p.x
    }
    const finding = findings.value.find(isFindingMatchingPointFactory(point))
    if (!finding) return
    const canvasBox = canvas?.getBoundingClientRect()
    showTooltipWith.value = {
      ...finding,
      x: element.element.x + (canvasBox?.x ?? 0),
      y: element.element.y + (canvasBox?.y ?? 0),
    }
  }
}
</script>

<style scoped lang="scss">
.performance-tile {
  position: relative;
}

.configuration-field {
  min-width: 200px;
  max-width: 12.5vw;

  +.configuration-field {
    margin-left: $space-component-m;
  }
}

.performance-tooltip[open] {
  // position
  position: fixed;
  top: v-bind(tooltipY);
  left: v-bind(tooltipX);
  overflow: visible; // for the arrow
  z-index: 9999;
  transform: translate(-50%, calc(-100% - 24px));

  >* {
    background-color: inherit;
  }

  h1 {
    margin: #{-$space-component-s} 0 $space-component-m 0;
  }

  .info {
    display: flex;
    flex-direction: column;
    gap: $space-component-xs;

    +.info {
      margin-top: $space-component-s;
    }
  }

}

.performance-tooltip::before {
  height: 16px;
  width: 32px;
  content: "";
  position: absolute;
  display: block;
  z-index: 0;
  background-color: inherit;
  bottom: 0px;
  left: calc(50% - 16px);
  right: 0;
  top: auto;
  box-shadow: none;
}

.performance-tooltip::after {
  height: 22px;
  width: 22px;
  content: "";
  position: absolute;
  display: block;
  z-index: -1;
  background-color: inherit;
  bottom: -11px;
  left: calc(50% - 11px);
  right: 0;
  top: auto;
  transform: rotate(45deg);
  transform-origin: center;
  box-shadow: inherit;
}

// layout
.tile-content {
  --min-height: 15vh;
  min-height: var(--min-height);
  height: 100%;

  &:not(.--empty) {
    margin: auto;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}

.empty-state-label {
  z-index: 2;
  margin: 0 auto;
}

.empty-state-illustration {
  min-height: 0;

}
</style>
