<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div class="relation-grid semantic-list">
    <span class="headings bg-background">
      Configurations
    </span>
    <span class="headings bg-background">
      Last Run
    </span>
    <span class="headings bg-background">
      Findings
    </span>
    <template v-for="item in items" :key="item[itemKey]">
      <span class="config">
        <slot name="configuration-column" :item="item" />
      </span>
      <span class="run">
        <slot name="run-column" :item="item" />
      </span>
      <span class="finding">
        <slot name="finding-column" :item="item" />
      </span>
    </template>
  </div>
</template>

<script setup lang="ts" generic="T extends Readonly<Record<string, any>>">
defineProps<{
  items: T[] | Readonly<T[]>
  /** property used as ID */
  itemKey: string
}>()
</script>

<style scoped lang="scss">
.relation-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, auto));
  gap: $space-component-s $space-component-xl;
  align-items: center;

  max-height: 100%;
  overflow: auto;

  &:hover {
    &::-webkit-scrollbar-thumb {
      // FIXME: should use vuetify colors later
      background-color: #757575;
    }
  }

  // chromium based browser, simulate a thin scrollbar
  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 12px;
    height: 12px;
  }

  >*:not(.headings) {
    max-width: fit-content;
  }
}

.headings {
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: $space-component-s;
  opacity: 0.5;

  // sticky behavior
  position: sticky;
  top: 0;
  z-index: 2;
}
</style>
