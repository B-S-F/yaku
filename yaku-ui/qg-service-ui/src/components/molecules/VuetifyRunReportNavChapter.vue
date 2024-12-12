<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div class="run-report-chapter navi-box bg-grey-lighten-2" :class="{
    'active': chapter.to && isSelected({ to: chapter.to })
  }">
    <RouterLink v-if="chapter.to" :to="chapter.to" class="run-report-chapter__header"
      @click="$emit('toggle-chapter', chapter.id)">
      <div class="run-report-chapter__title">
        <VuetifyStatusPill rounded v-bind="statusPill" :label="undefined">
          <template #icon>
            <component :is="statusPill.iconComponent" v-if="statusPill.iconComponent" />
            <FrogIcon v-else :icon="statusPill.icon" />
          </template>
        </VuetifyStatusPill>
        <VuetifyMarkdown tag="span" class="text-body-2 font-weight-bold" :source="chapter.name" />
      </div>
      <div class="run-report-chapter__actions">
        <slot name="task" />
        <FrogButton integrated :icon="isOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'" class="run-report-chapter__button"
          @click.stop.prevent="$emit('toggle-chapter', chapter.id)" />
      </div>
    </RouterLink>
  </div>
  <ul v-if="isOpen" class="run-report-chapter__requirements semantic-list">
    <li v-for="requirement in chapter.requirements" :key="`${chapter.id}-${requirement.id}`" data-cy="sub-navi-item">
      <slot name="requirement" v-bind="requirement" />
    </li>
  </ul>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import useRunResultsReport from '~/composables/runResults/useRunResultsReport'
import {
  getResultPillFromStatus,
  getVuetifyRunPillFromOverallResult,
} from '~/helpers'
import { RunReportNavChapterProps } from '~/types'

const props = defineProps<{
  chapter: RunReportNavChapterProps
  manualStatus?: boolean
  isOpen: boolean
}>()

defineEmits<(e: 'toggle-chapter', chapterId: string) => void>()
const statusPill = computed(() =>
  props.manualStatus
    ? getResultPillFromStatus(props.chapter.color, true)
    : getVuetifyRunPillFromOverallResult(props.chapter.color),
)

const { isSelected } = useRunResultsReport()
</script>
<style scoped lang="scss">
@use '../../styles/mixins/flex.scss' as Flex;

.run-report-chapter {
  @include Flex.flexbox;
  padding: $padding-component-s;
  background-color: #e0e2e5;
  cursor: pointer;

  &:hover,
  &:focus {
    background-color: #c1c7cc;
  }

  &:active {
    background-color: #a4abb3;
  }

  &.active {
    background-color: #d1e4ff;
  }

  &__header {
    color: inherit;
    text-decoration: none;
    @include Flex.flexbox($justify: space-between);
    column-gap: $space-label-s;
    width: 100%;

    span {
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      /* number of lines to show */
      line-clamp: 2;
      -webkit-box-orient: vertical;
      text-overflow: ellipsis;
    }
  }

  &__title {
    @include Flex.flexbox;
    column-gap: $space-component-m;
    width: 100%;
    overflow: hidden;
    flex: 1;
  }

  &__actions {
    @include Flex.flexbox;
  }

  &.active {
    background-color: #d1e4ff;
  }

  .run-report-chapter__button {
    &:hover {
      color: inherit;
    }
  }

}

.-no-margin {
  margin: 0;
}
</style>
