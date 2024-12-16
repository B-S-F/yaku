<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <section class="code-card">
    <header>
      <FrogIcon class="icon" :icon="icon" />
      <FrogButton integrated icon="mdi-plus" class="font-weight-bold" data-cy="add-to-config" @click="emit('add')">
        Add to config
      </FrogButton>
    </header>
    <div class="card-content">
      <component :is="headlineTag" class="test-md-body-1 font-weight-bold">
        {{ headline }}
      </component>
      <FrogAccordion class="code-detail" small :headline="description">
        <template #content>
          <slot name="description" />
        </template>
      </FrogAccordion>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  icon: string
  headlineTag: string
  headline: string
  description: string
}>()

const emit = defineEmits<(e: 'add') => void>()
</script>

<style scoped lang="scss">
@use '../../styles/_abstract.scss' as *;
$space: 8px;

.code-card {
  &:hover {
    .card-content {
      background-color: #90CAF9; // blue-lighten-3

      .-dark-mode & {
        background-color: #0D47A1; // blue-darken-4
      }
    }
  }
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #E0E0E0; // grey-lighten-2

  .-dark-mode & {
    background-color: #212121; // grey-darken-4
  }

  .icon {
    padding: 0 $space;
  }
}

.card-content {
  display: flex;
  flex-direction: column;
  row-gap: $space;
  padding: $space 12px;
  background-color: #FAFAFA; // grey-lighten-5

  .-dark-mode & {
    background-color: #616161; // grey-darken-2
  }

  &>*:first-child {
    margin: 0;
  }
}

.code-detail {
  &:deep(.v-expansion-panel) {
    border: none;
    background-color: #FAFAFA !important; // grey-lighten-5


    & :deep(.v-expansion-panel-title) {
      margin-right: -12px;
    }

    &:deep(.v-expansion-panel-title--active) {
      & :deep(.v-expansion-panel-text) {
        padding: 0 0 0.5rem;
      }

      & :deep(.v-expansion-panel-title__overlay) {
        white-space: inherit;
        margin-top: 12px;
      }

      & :deep(.v-expansion-panel-title__icon) {
        align-self: flex-start;
      }
    }
  }

  &:deep(.v-expansion-panel-title:not(.v-expansion-panel-title--active)) {
    display: inline-block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 1rem;
    font-weight: 400;
    /* Adjust this value based on the button width */
  }

  &:deep(.v-expansion-panel__shadow) {
    display: none;
  }
}
</style>
