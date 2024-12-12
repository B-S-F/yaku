<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div class="chart">
    <div class="percentage-col text-body-2">
      <span v-for="percentage in values" :key="percentage">{{ percentage }}</span>
    </div>
    <div class="bars-col">
      <span v-for="index in values.length - 1" :key="index" class="line" />
      <div class="bars">
        <div v-for="(group, groupIndex) in barGroups" :key="groupIndex" class="bar-group">
          <VuetifySelectableChartFilter v-for="bar in group" :key="bar.id" class="bar"
            :class="{ 'with-results': bar.val != 0 }" :style="{ '--bg-color': bar.bgColor }" :data-cy="`bar-${bar.id}`"
            :disabled="!bar.val" :selected="isSelected(bar.id)" @click="selectBar(bar.id)"
            @mousemove="setTooltipPosition">
            <div class="bar-background">
              <span class="font-weight-bold text-body-2">
                {{ bar.val }}%
              </span>
              <div class="bar-fill" :style="{ '--color': bar.color, '--height': bar.val }" />
            </div>
            <FrogIcon :icon="bar.icon" class="bar-icon" />
            <FrogTooltip class="bar-tooltip" :label="bar.label ?? ''" />
          </VuetifySelectableChartFilter>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

export type Bar = {
  id: string | number
  /** value between [0, 100] */
  val: number
  color: string
  bgColor: string
  label?: string
  icon: string
}

type SelectedBar = Bar['id'] | undefined

const props = defineProps<{
  selected?: SelectedBar
  /** Each bar should have a unique id independant of the group. */
  barGroups: Bar[][]
  values: string[]
}>()

const emit =
  defineEmits<(e: 'update:selected', selected: SelectedBar) => void>()

const positionX = ref('0px')
const positionY = ref('0px')

const selectBar = (barId: string | number | undefined) => {
  emit('update:selected', props.selected === barId ? undefined : barId)
}

const isSelected = (barId: Bar['id']) => props.selected === barId

const setTooltipPosition = (event: MouseEvent) => {
  positionX.value = event.clientX + 15 + 'px'
  positionY.value = event.clientY + 20 + 'px'
}
</script>

<style scoped lang="scss">
.chart {
  --padding-bar: 4px;
  --width-bar: 40px;
  --divider-height: 18px;
  --dividers-gap: 12px;
  --font-size-icons: 16px;

  padding-bottom: var(--font-size-icons);
  display: flex;
  gap: $space-component-s;
  // bars + chart gap + bar groups gap + width of percentage col
  width: calc((var(--width-bar) + var(--padding-bar) * 2) * 5 + $space-component-s + 3ch);


  .percentage-col {
    display: flex;
    flex-direction: column;
    gap: $space-component-m;
    text-align: right;
    color: #979ea4;
  }

  .bars-col {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: var(--dividers-gap);
    position: relative;

    .line {
      display: flex;
      align-items: center;
      height: var(--divider-height);

      &::before {
        width: 100%;
        position: absolute;
        content: "";
        height: 1px;
        background-color: #e0e2e5;
      }
    }

    .bars {
      position: absolute;
      display: flex;
      align-items: flex-end;
      gap: $space-elements;
      bottom: -15.5px;
      left: 3px;
      height: calc(100% + 15.5px);
    }
  }
}

.bar-group {
  display: flex;
  height: 100%;

  :deep(.v-btn) {
    height: 100% !important;
  }

  :deep(.v-btn.selected) {
    background-color: var(--bg-color) !important;
  }
}

.bar {
  :deep(.v-btn__content) {
    display: flex !important;
    flex-direction: column;
    justify-content: flex-end;
    position: relative;
    padding-inline: var(--padding-bar);
    row-gap: 2px;
    height: 100%;
  }

  &[disabled],
  &[disabled]:hover,
  &[disabled]:focus-visible {
    .bar-icon {
      color: #979ea4;
    }
  }

  &.selected {
    &:not(:hover) .bar-icon {
      color: #00629a;
    }
  }

  &:hover,
  &:focus-visible {
    .bar-icon {
      color: #007bc0;
    }


    .bar-tooltip {
      visibility: visible;
    }

  }

  &:not(:focus-visible) {
    outline: none;
  }

  &:focus-visible:not(:hover) {
    .bar-tooltip {
      position: absolute;
      left: 50%;
      top: 0%;
      transform: translate(-50%, -110%);
    }
  }
}

.bar-background {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  background-color: transparent;
  height: 100%;
}

.bar-fill {
  width: var(--width-bar);
  min-height: 1px; // the bar should at least be 1px to display the color
  background-color: var(--color);
  // var(--height) % of (100% - gap between divider spans)
  height: calc((var(--height) / 100) * (100% - var(--divider-height)));
}

.bar-icon {
  text-align: center;
  font-size: var(--font-size-icons);
}

.bar-tooltip {
  position: fixed;
  visibility: hidden;
  left: v-bind(positionX);
  top: v-bind(positionY);
  height: fit-content;
}

@media (max-width: $mdScreenWidth) {
  .chart {
    --padding-bar: 2px;
    --width-bar: 33px;
  }
}
</style>
