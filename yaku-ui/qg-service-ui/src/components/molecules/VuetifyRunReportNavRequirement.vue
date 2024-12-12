<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div class="run-report-requirement bg-background" :class="{
    'run-report-requirement--closed': !showChecks,
  }">
    <RouterLink v-if="requirement.to" :to="requirement.to" class="run-report-requirement__link" @click="toggleChecks">
      <div class="run-report-requirement__header">
        <VuetifyStatusPill rounded v-bind="statusPill" :label="undefined" />
        <VuetifyMarkdown class="font-weight-bold text-body-2" tag="span" :source="requirement.id" />
      </div>
      <div class="run-report-requirement__title-button">
        <VuetifyMarkdown class="text-body-2" tag="span" :source="requirement.name" />
        <slot name="task" />
        <FrogButton integrated :icon="showChecks ? 'mdi-chevron-up' : 'mdi-chevron-down'" class="run-report-requirement__button"
          @click.stop.prevent="toggleChecks" />
      </div>
    </RouterLink>
  </div>
  <ul v-if="showChecks" class="run-report-requirement__checks semantic-list">
    <li v-for="(check, index) in requirement.checks" :key="index">
      <slot name="check" v-bind="check" />
    </li>
  </ul>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { getVuetifyRunPillFromOverallResult } from '~/helpers'
import { RunReportNavRequirementProps } from '~/types'
const props = defineProps<{
  requirement: RunReportNavRequirementProps
}>()

const statusPill = computed(() =>
  getVuetifyRunPillFromOverallResult(props.requirement.color),
)

const showChecks = ref<boolean>(false)
const toggleChecks = () => (showChecks.value = !showChecks.value)
</script>
<style scoped lang="scss">
@use '../../styles/mixins/flex.scss' as Flex;

.run-report-requirement {
  padding: $padding-component-s;
  padding-left: calc($padding-component-s + $space-component-s);
  @include Flex.flexbox($direction: column, $align: start);
  row-gap: $space-component-s;
  width: 100%;
  cursor: pointer;

  &:hover .run-report-chapter__button {
    color: #c1c7cc; // FIXME
  }

  &:active .run-report-chapter__button {
    color: #a4abb3; // FIXME
  }


  &.active {
    background-color: #d1e4ff; // FIXME
  }

  &--closed {
    border-bottom: 1px solid #71767c; // FIXME
  }

  &__link {
    color: inherit;
    text-decoration: none;
    width: 100%;

    span {
      text-decoration: none;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: wrap;
      flex: 1;
      word-break: break-all;
    }
  }

  &__header {
    @include Flex.flexbox;
    column-gap: $space-component-xs;
    margin-bottom: $space-component-s;

    .pill {
      max-width: 100%;
      width: 16px;
      height: 16px;
      border-radius: 50%;
    }
  }

  &__title-button {
    @include Flex.flexbox($align: center, $justify: space-between);
  }
}
</style>
