<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <article class="release-report-meta">
    <header class="header">
      <FrogIcon v-if="headerIcon" :icon="headerIcon" />
      <h3 class="text-lg-h6 font-weight-bold">
        {{ title }}
      </h3>
    </header>
    <dl class="content">
      <div v-for="(data, idx) in info" :key="idx">
        <dt class="highlighted font-weight-bold">
          {{ data.title }}
        </dt>
        <dd>{{ data.description }}</dd>
      </div>
    </dl>
  </article>
</template>
<script setup lang="ts">
import { ReleaseReportMeta } from '~/types/ReleaseReport'

defineProps<{
  headerIcon?: string
  title: string
  info: ReleaseReportMeta[]
}>()
</script>
<style lang="scss" scoped>
@use '../../styles/mixins/flex.scss' as Flex;

.release-report-meta {
  @include Flex.flexbox($direction: column, $align: stretch);

  header {
    @include Flex.flexbox;
    column-gap: 24px;
    padding: 8px;
    border-bottom: 1px solid #757575; // grey-darken-1//FIXME var(--neutral__disabled__front__default);
  }

  header h3 {
    margin: 0;
  }

  dl,
  dt {
    font-size: 14px;
  }

  dl {
    margin: 0;
  }

  dl.content div {
    display: grid;
    grid-template-columns: minmax(auto, 80px) 1fr;
    grid-template-rows: 1fr;
    column-gap: 24px;
    padding: 8px;
    border-bottom: 1px solid #757575; // grey-darken-1//FIXME var(--neutral__disabled__front__default);

    @media screen and (max-width: $bp-max-820) {
      grid-template-columns: 1fr;
    }

    @media print {
      grid-template-columns: auto 1fr;
    }
  }

  dl.content dd {
    text-align: left;
    margin: 0;
  }
}
</style>
