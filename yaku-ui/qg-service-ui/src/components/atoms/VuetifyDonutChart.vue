<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <VuetifyStack v-slot="{ visibleClass }" class="donut-chart">
    <svg :class="visibleClass" :viewBox="`0 0 ${SVG_SIZE} ${SVG_SIZE}`">
      <!-- <ellipse :stroke="RANGE_COLOR" :stroke-width="STROKE_WIDTH" :cx="MID_X" :cy="MID_Y" :rx="RADIUS" :ry="RADIUS" /> -->
      <path :d="rangePath" :stroke="rangeColor" :stroke-width="STROKE_WIDTH" />
      <path :d="valuePath" :stroke="valueColor" :stroke-width="STROKE_WIDTH" />
    </svg>
    <div :class="visibleClass" class="inner-donut">
      <slot name="content" />
    </div>
  </VuetifyStack>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type Props = {
  value: number
  valueColor: string
  rangeColor?: string
}
const props = withDefaults(defineProps<Props>(), {
  rangeColor: '#C1C7CC',
})

const SVG_SIZE = 100
const MID_X = SVG_SIZE / 2
const MID_Y = SVG_SIZE / 2

const RADIUS = (SVG_SIZE / 2) * 0.8

const MIN_DEGREE = 0
const MAX_DEGREE = 359

const STROKE_WIDTH = 8

/** Map a value between in-bounds (inMin to inMax) to out-bounds (outMin to outMax) */
const mapRange = (
  val: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
) => ((val - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin

const minValue = 0
const maxValue = 100

const polarToCartesian = (
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  }
}

const describeArc = (
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) => {
  const start = polarToCartesian(x, y, radius, endAngle)
  const end = polarToCartesian(x, y, radius, startAngle)

  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'

  const d = [
    'M',
    start.x,
    start.y,
    'A',
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(' ')

  return d
}

const progressToAngle = computed(() =>
  mapRange(props.value, minValue, maxValue, MIN_DEGREE, MAX_DEGREE),
)
const valuePath = computed(() =>
  describeArc(MID_X, MID_Y, RADIUS, 0, progressToAngle.value),
)

/** Shrink the range path of X degree to split the two arcs correctly */
const DEGREE_MARGIN = 5
const rangeMargin = computed(() =>
  progressToAngle.value === 0 ? 0 : DEGREE_MARGIN,
)
const rangePath = computed(() =>
  describeArc(
    MID_X,
    MID_Y,
    RADIUS,
    progressToAngle.value + rangeMargin.value,
    MAX_DEGREE - rangeMargin.value,
  ),
)
</script>

<style scoped lang="scss">
svg>* {
  fill: transparent;
}

.inner-donut {
  display: grid;
  place-content: center;
}
</style>
