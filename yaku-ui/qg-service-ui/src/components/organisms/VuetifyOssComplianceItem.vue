<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <header :class="{ closed: closed }" @click="() => closed = !closed">
    <h2>{{ component.name }}</h2>
    <FrogIcon :icon="closed ? 'mdi-chevron-down' : 'mdi-chevron-up'" />
  </header>
  <ul v-if="!closed" class="semantic-list fields">
    <li v-if="component.version" class="item">
      <span>Version</span>
      <span>{{ component.version }}</span>
    </li>
    <li v-if="component.type" class="item">
      <span>Type</span>
      <span>{{ component.type }}</span>
    </li>
    <li v-if="component.group" class="item">
      <span>Group</span>
      <span>{{ component.group }}</span>
    </li>
    <li v-if="component.purl" class="item">
      <span>Purl</span>
      <span>{{ component.purl }}</span>
    </li>
    <li v-if="component.licenses && component.licenses.length > 0" class="item">
      <span>Licenses</span>
      <div class="divided-container">
        <component :is="item.license.url ? 'a' : 'span'" v-for="item in component.licenses" :key="item.license.id"
          :href="item.license.url" target="_blank">
          {{ item.license.name }}
        </component>
      </div>
    </li>
    <li v-if="component.description && component.description !== 'NONE'" class="item block">
      <span>Description</span>
      <span>{{ component.description }}</span>
    </li>
    <li v-if="component.hashes && component.hashes.length > 0" class="item block">
      <ul class="semantic-list fields">
        <li class="item">
          <span>Hash</span>
          <div class="table">
            <div v-for="hash in component.hashes" :key="hash.alg" class="row">
              <span>{{ hash.alg }}</span>
              <span>{{ hash.content }}</span>
            </div>
          </div>
        </li>
      </ul>
    </li>
    <li v-if="component.externalReferences && component.externalReferences.length > 0" class="item block">
      <ul class="semantic-list fields">
        <li class="item">
          <span>External Reference</span>
          <div class="table">
            <div v-for="reference in component.externalReferences" :key="reference.type" class="row">
              <span>{{ reference.type }}</span>
              <a :href="reference.url" target="_blank">
                {{ reference.url }}
              </a>
            </div>
          </div>
        </li>
      </ul>
    </li>
    <li class="icon-item block">
      <FrogIcon icon="mdi-copyright" />
      <div class="divided-container">
        <span v-for="(copyright, indexCopyright) in component.copyright" :key="indexCopyright">
          {{ copyright }}
        </span>
      </div>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Component } from '~/types'

defineProps<{
  component: Component
}>()

const closed = ref(true)
</script>

<style scoped lang="scss">
@use '../../styles/components/oss-compliance.scss';

h2 {
  margin: 0;
}

header {
  display: flex;
  justify-content: space-between;
  cursor: pointer;
  padding-bottom: $space-component-l;
  border-bottom: solid 1px var(--v-theme-background);

  :deep(*) {
    font-size: 1.25rem;
  }

  &.closed {
    border-bottom: none;
    padding-bottom: 0;
  }
}

.row {
  display: flex;
  gap: $spacing-12;

  :first-child {
    min-width: 100px;
  }
}

.icon-item {
  display: flex;
  gap: $space-component-s;

  :deep(.v-icon) {
    font-size: 1rem;
  }
}

.block {
  width: 100%;
}

.divided-container {
  $divider-gap: $space-component-xs;

  display: flex;
  column-gap: $space-component-l;
  row-gap: $divider-gap;
  align-items: baseline;
  flex-wrap: wrap;
  overflow-x: hidden; // hide unnecessary dividers

  >* {
    position: relative;

    // divider
    &:not(:first-of-type)::before {
      content: "";
      width: 2px;
      height: 100%;
      border-left: 1px solid #EEEEEE; // grey lighten-3
      position: absolute;
      top: 0;
      bottom: 0;
      left: calc($divider-gap * (-2));
    }
  }
}
</style>
