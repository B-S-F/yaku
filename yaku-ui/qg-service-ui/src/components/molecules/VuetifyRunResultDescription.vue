<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div class="result-stats">
    <VuetifyRunResultOverview class="overview" v-bind="stats ?? {}" />
    <span>
      Result for answered checks
    </span>
    <ul v-if="stats && hasValues(stats)" class="semantic-list">
      <li v-if="stats.red" class="text-red">
        {{ stats.red }}% failed
      </li>
      <li v-if="stats.yellow" class="text-yellow-darken-2">
        {{ stats.yellow }}% warnings
      </li>
      <li v-if="stats.green" class="text-green">
        {{ stats.green }}% passed
      </li>
      <li v-if="stats.na" class="text-blue">
        {{ stats.na }}% NA
      </li>
      <li v-if="stats.unanswered" class="text-grey">
        {{ stats.unanswered }}% unanswered
      </li>
    </ul>
    <span v-else class="no-stats text-grey">
      {{ noResultLabel }}
    </span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  stats?: {
    red: number
    yellow: number
    green: number
    na: number
    unanswered: number
  }
  noResultLabel: string
}>()

const hasValues = (o: object) => Object.values(o).some((x) => x > 0)
</script>

<style scoped lang="scss">
.result-stats {
  display: flex;
  flex-flow: column nowrap;
  $halfSpace: 0.375rem; // column-gap and '|' use it to get the total space between two <li>

  .semantic-list {
    display: flex;
    column-gap: #{2 * $halfSpace};
  }

  li {
    display: flex;
  }

  li+li::before {
    content: '|';
    display: inline;
    color: rgb(var(--v-theme-primary));
    background-color: transparent;
    top: 0; // avoid a reset
    width: fit-content;
    left: #{-$halfSpace};
    transform: translateX(-50%);
  }
}

.overview {
  display: flex;
  margin-bottom: $space-component-s;

  :deep(i) {
    display: none;
  }
}

@media screen and (min-width: 1000px) {
  .result-stats .overview {
    display: none;
  }
}
</style>
