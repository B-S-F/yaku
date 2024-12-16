<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <FrogAccordion flat class="report-progress bg-white" tag="section" initialOpen>
    <template #headline>
      <div class="report-summary">
        <VuetifyRunResultOverview v-if="!selected" class="large-overview" v-bind="stats ?? {}" />
        <FrogChip v-else id="selected-chip" :label="selectedChip.label.toLowerCase()" removable
          :style="`color: ${selectedChip.color}; background-color: ${selectedChip.bgColor}`"
          @click="selected = undefined">
          <template #before>
            <FrogIcon :icon="selectedChip.icon" iconClass="a-chip__icon" />
          </template>
        </FrogChip>
      </div>
    </template>
    <template #content>
      <div class="charts">
        <VuetifyBarChart v-if="resultBars" v-model:selected="selected" :barGroups="[resultBars]"
          :values="PERCENTAGE_LABELS" />
        <VuetifySelectableChartFilter v-if="manualBar" class="manual-wrapper" :disabled="manualBar.val === 0"
          :style="{ '--bg-color': manualBar.bgColor }" :selected="selected === manualBar.id"
          @click="selected = selected === manualBar.id ? undefined : manualBar.id.toString()"
          @mousemove="setTooltipPosition">
          <VuetifyDonutChart class="manual-chart" :value="manualBar.val" :valueColor="manualBar.color">
            <template #content>
              <FrogIcon class="manual-icon" :icon="manualBar.icon" style="font-size: 1rem;" />
            </template>
          </VuetifyDonutChart>
          <span class="font-weight-bold text-body-2">{{ manualBar.val }}%</span>
          <FrogTooltip class="bar-tooltip" label="Manual answers" />
        </VuetifySelectableChartFilter>
      </div>
    </template>
  </FrogAccordion>
</template>

<script setup lang="ts">
import { ComputedRef, computed, ref } from 'vue'
import type { Bar } from '~/components/molecules/BarChart.vue'
import { CHECK_DISPLAY_CONFIG } from '~/composables/useCheckDisplay'
import { selectedResultBarPills } from '~/helpers/getPillInfo'

const props = defineProps<{
  filterBy: string | undefined
  results?: {
    RED: number
    YELLOW: number
    GREEN: number
    NA: number
    UNANSWERED: number
  }
  answered?: {
    automatic: number
    manual: number
  }
}>()

const emit =
  defineEmits<(e: 'update:filterBy', selected: string | undefined) => void>()

const PERCENTAGE_LABELS = ['%', '100', '75', '50', '25', '0']

const resultBars: ComputedRef<Bar[] | undefined> = computed(() =>
  props.results
    ? [
        {
          id: 'FAILED',
          val: props.results.RED,
          label: 'Failed',
          color: '#ff2124',
          bgColor: '#ffd9d9',
          icon: CHECK_DISPLAY_CONFIG.RED.icon,
        },
        {
          id: 'YELLOW',
          val: props.results.YELLOW,
          label: 'Warning',
          color: '#ffcf00',
          bgColor: '#ffdf95',
          icon: CHECK_DISPLAY_CONFIG.YELLOW.icon,
        },
        {
          id: 'GREEN',
          val: props.results.GREEN,
          label: 'Passed',
          color: '#00884a',
          bgColor: '#b8efc9',
          icon: CHECK_DISPLAY_CONFIG.GREEN.icon,
        },
        {
          id: 'NA',
          val: props.results.NA,
          label: 'Not applicable',
          color: '#007bc0',
          bgColor: '#d1e4ff',
          icon: CHECK_DISPLAY_CONFIG.NA.icon,
        },
        {
          id: 'UNANSWERED',
          val: props.results.UNANSWERED,
          label: 'Unanswered',
          color: '#a4abb3',
          bgColor: '#e0e2e5',
          icon: 'mdi-file-minus-outline',
        },
      ]
    : undefined,
)

const selectedChip = computed(() => {
  const res =
    selected.value === 'MANUAL'
      ? manualBar.value
      : resultBars.value?.find((r) => r.id === selected.value)
  const label = res?.label ?? ''
  return {
    color: selectedResultBarPills[selected.value || 'NA'].color,
    bgColor: selectedResultBarPills[selected.value || 'NA'].bg,
    label,
    icon: selectedResultBarPills[selected.value || 'NA'].icon,
  }
})

const manualBar = computed<Bar | undefined>(() =>
  props.answered
    ? {
        id: 'MANUAL',
        val: props.answered.manual,
        label: 'Manual answers',
        color: '#9e2896',
        bgColor: '#f0dcee',
        icon: 'mdi-account-check-outline',
      }
    : undefined,
)

const selected = computed({
  get() {
    return props.filterBy
  },
  set(v) {
    emit('update:filterBy', v)
  },
})

/** the same behavior as the BarChart tooltips, but for the donut chart */
const positionX = ref('0px')
const positionY = ref('0px')
const setTooltipPosition = (event: MouseEvent) => {
  positionX.value = event.clientX + 15 + 'px'
  positionY.value = event.clientY + 20 + 'px'
}

const stats = computed(() => ({
  green: props.results?.GREEN,
  red: props.results?.RED,
  yellow: props.results?.YELLOW,
  na: props.results?.NA,
  unanswered: props.results?.UNANSWERED,
}))
</script>

<style scoped lang="scss">
.report-progress {
  background-color: var(--v-theme-background);

  &.v-expansion-panels {
    border-top: none;

    :deep(.a-chip__label) {
      text-transform: capitalize;
    }

    :deep(.v-expansion-panel--active) {
      >.v-expansion-panel-title {
        >.report-summary {
          display: none;
        }
      }

      >.v-expansion-panel-title {
        padding-bottom: $padding-component-s;
        flex-direction: row-reverse;
      }
    }
  }

  :deep(.v-expansion-panel-title) {
    height: 56px; // Fixed height
    padding: 0;
    margin-right: calc(-1 * #{$padding-component-s});
  }

  :deep(.v-expansion-panel-title__icon .v-btn) {
    padding: 0.4rem 0.5rem 0.25rem 0.75rem;
    margin-left: -0.25rem;
  }

  :deep(.v-expansion-panel-title__icon .v-icon) {
    font-size: 1.5rem;
  }
}

.charts {
  display: flex;
  column-gap: $space-component-m;
}

.manual-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: fit-content;

  &[disabled]:hover .manual-icon {
    color: #000000;
  }

  &:hover .manual-icon {
    color: #007bc0;
  }

  // &:focus-visible:not(:hover) {
  //   .manual-wrapper-popover {
  //     position: absolute;
  //     left: 50%;
  //     top: 0%;
  //     transform: translate(-50%, -110%);
  //   }
  // }
  &:hover,
  &:focus-visible {
    .bar-tooltip {
      visibility: visible;
    }
  }
}

.manual-chart {
  width: 2.5rem;
  --size: 40px;
}

.bar-tooltip {
  position: fixed;
  visibility: hidden;
  left: v-bind(positionX);
  top: v-bind(positionY);
  height: fit-content;
}
</style>
