<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div class="run-report-check bg-background" :class="{
    'active': check.to && isSelected({ to: check.to })
  }">
    <RouterLink v-if="check.to" :to="check.to" class="run-report-check__link">
      <div class="run-report-check__header">
        <VuetifyStatusPill rounded v-bind="statusPill" :label="undefined" />
        <VuetifyMarkdown class="text-caption" tag="span" :source="check.id" />
      </div>
      <VuetifyMarkdown class="text-subtitle-2 font-weight-light" tag="span" :source="check.name" />
    </RouterLink>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import useRunResultsReport from '~/composables/runResults/useRunResultsReport'
import { getVuetifyRunPillFromOverallResult } from '~/helpers'
import { RunReportNavCheckProps } from '~/types'

const props = defineProps<{
  check: RunReportNavCheckProps
}>()
const statusPill = computed(() =>
  getVuetifyRunPillFromOverallResult(props.check.color),
)
const { isSelected } = useRunResultsReport()
</script>
<style scoped lang="scss">
@use '../../styles/mixins/flex.scss' as Flex;

.run-report-check {
  padding: $padding-component-s $padding-component-s $padding-component-s $padding-component-l;
  @include Flex.flexbox($direction: column, $align: start);
  row-gap: $space-component-s;
  width: 100%;

  &.active {
    background-color: #e8f1ff;
  }

  &__link {
    color: inherit;
    text-decoration: none;
    border-bottom: 1px solid #71767c;
    width: 100%;

    span {
      text-decoration: none;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: wrap;
      flex: 1;
      word-break: break-all;
    }

    &:hover {
      color: #0096e8;
    }

    &:active {
      color: #56b0ff;
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
}
</style>
