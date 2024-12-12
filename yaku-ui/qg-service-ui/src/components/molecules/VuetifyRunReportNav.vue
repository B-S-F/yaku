<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <ul class="run-report-nav semantic-list">
    <li v-for="chapter in chapters" :key="chapter.id" data-cy="navi-item">
      <slot name="chapter" v-bind="chapter" />
    </li>
  </ul>
</template>
<script setup lang="ts">
import { RunReportNavChapterProps } from '~/types'

defineProps<{
  chapters?: RunReportNavChapterProps[]
}>()
</script>
<style scoped lang="scss">
@use '../../styles/mixins/flex.scss' as Flex;

.run-report-nav {
  @include Flex.flexbox($direction: column);
  row-gap: $space-component-s;
  overflow: auto;

  :deep(li) {
    width: 100%;
  }
}
</style>
