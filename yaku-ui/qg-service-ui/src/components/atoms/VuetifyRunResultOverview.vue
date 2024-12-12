<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div class="chart">
    <FrogIcon icon="mdi-chart-box-outline" />
    <div class="bar bg-red" :style="{ '--grow': red }" />
    <div class="bar bg-yellow" :style="{ '--grow': yellow }" />
    <div class="bar bg-green" :style="{ '--grow': green }" />
    <div class="bar bg-blue" :style="{ '--grow': na }" />
    <div class="bar bg-grey unanswered" :style="{ '--grow': unanswered }" />
  </div>
</template>

<script setup lang="ts">
type RunResultOverviewProps = {
  red?: number
  yellow?: number
  green?: number
  na?: number
  unanswered?: number
}
withDefaults(defineProps<RunResultOverviewProps>(), {
  red: 0,
  yellow: 0,
  green: 0,
  na: 0,
  unanswered: 0,
})
</script>

<style scoped lang="scss">
.chart {
  display: flex;
  column-gap: $space-component-xs;
  height: 1.5rem;

  align-items: flex-end;

  .v-icon {
    width: $size-icon-m;
    height: $size-icon-m;
    margin-right: $space-component-xs;
  }

  .unanswered {
    margin-left: $space-component-s;
  }
}

.bar {
  margin-bottom: 3px; // align with the icon
  min-height: 1px;
  max-height: 1rem;
  width: 1rem;
  height: calc(var(--grow, 0) * 16px * 0.01); // divide percentage by 4 and set the default px unit
}
</style>
