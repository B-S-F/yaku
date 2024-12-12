<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <header class="wrapper bg-background">
    <VuetifyStatusPill rounded :color="pill.color" :showTooltip="false">
      <template #icon>
        <FrogIcon v-if="pill.icon" :icon="pill.icon" />
        <component :is="pill.iconComponent" />
      </template>
    </VuetifyStatusPill>
    <div class="header">
      <div class="title">
        <h1 :title="pill.tooltip">
          {{ pill.tooltip }}
        </h1>
      </div>
      <ul class="semantic-list metadata">
        <li>
          <span>Name</span>
          <span class="name font-weight-bold" :title="name">{{ name }}</span>
        </li>
        <li>
          <span>Version</span>
          <span class="font-weight-bold">{{ version }}</span>
        </li>
        <li>
          <span>Date</span>
          <span class="font-weight-bold">{{ date }}</span>
        </li>
      </ul>
    </div>
  </header>
</template>

<script setup lang="ts">
import type { RunCompleted, RunState } from '~/types'
import { computed } from 'vue'
import { RunResultStatus } from '~/types/RunReport'

import { getVuetifyRunPillInfo } from '~/helpers/getPillInfo'

const props = defineProps<{
  overallResult: Exclude<RunResultStatus, 'RUNNING'>
  name: string
  date: string
  version: string
}>()

const state = computed(
  () =>
    ({
      status: 'completed',
      overallResult:
        props.overallResult === 'NA' ? 'GREEN' : props.overallResult,
    }) as RunState,
)
const run = computed(
  () =>
    ({
      ...state.value,
      completionTime: props.date,
    }) as RunCompleted,
)

const pill = computed(() => getVuetifyRunPillInfo(run.value))
</script>

<style scoped lang="scss">
@use '../../styles/_abstract.scss' as *;

.wrapper {
  display: flex;
  align-items: center;
  background-color: var(--v-theme-background); // FIXME: --background
  padding: 0 $space-component-m;
}

.pill {
  padding: $spacing-4;
  border-radius: 50%;
}

.header {
  min-width: 0;
  flex-grow: 1;
  display: flex;
  gap: 1px;
  margin-right: $spacing-16;
  background-color: var(--v-theme-background); // FIXME: --view-background

  .title,
  .metadata {
    background-color: var(--v-theme-background); // FIXME: --background
  }
}

.title {
  width: 350px;
  padding: $padding-component-s $padding-component-s $padding-component-s $padding-component-m;
  display: flex;
  align-items: center;

  h1 {
    font-size: 0.875rem;
    margin: 0;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    /* number of lines to show */
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }
}

.metadata {
  padding: $spacing-12 $spacing-20 $spacing-12 $spacing-36;
  flex-grow: 1;
  display: flex;
  align-items: center;
  row-gap: $spacing-12;
  column-gap: min(5vw, 60px);

  li {
    display: grid;
    grid-template-rows: 1fr 1fr;
    gap: $spacing-4;
    font-size: 0.75rem;

    span {
      max-width: 200px;
      display: inline-block;
      @extend %inline-ellipsis;

      &.name {
        max-width: 400px;
      }
    }
  }
}

@media (max-width: $mdScreenWidth) {
  .title {
    width: 285px;
  }

  .metadata li span {
    max-width: 180px;

    &.name {
      max-width: 300px;
    }
  }
}
</style>
