<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <section class="dashboard-tile bg-background">
    <header>
      <h2 class="heading text-h6 font-weight-bold">
        {{ heading }}
      </h2>
      <slot name="before-context-menu" />
      <FrogButton class="context-actions" disabled integrated icon="mdi-dots-horizontal" />
    </header>
    <v-divider />
    <div v-if="!isEmpty" class="content">
      <slot>
        <div class="under-development text-disabled">
          <FrogIcon icon="mdi-account-hard-hat-outline" style="font-size: 2em;" />
          <span>Under development</span>
        </div>
      </slot>
    </div>
    <slot v-else name="empty" />
  </section>
</template>

<script setup lang="ts">
defineProps<{
  heading: string
  isEmpty?: boolean
}>()
</script>

<style scoped lang="scss">
.dashboard-tile {
  display: flex;
  flex-direction: column;
  min-height: 300px;
}

header {
  display: flex;
  align-items: center;
  padding: $space-component-s $space-component-l;

  .heading {
    flex-grow: 1;
  }
}

.heading {
  margin: 0;
}

.context-actions {
  margin-left: $space-component-m;
}

.content {
  min-height: 0;
  height: 100%;
  padding: $space-elements;
}

.under-development {
  font-size: 1.25rem;
  display: flex;
  column-gap: 16px;
  height: 100%;
  align-items: center;
  justify-content: center;
}
</style>
