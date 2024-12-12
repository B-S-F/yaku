<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <h3 v-if="namespaceOptions.length > 0" class="heading text-body-2 font-weight-bold">
    Select a namespace
  </h3>
  <ul v-if="namespaceOptions.length > 0" class="semantic-list namespace-menu-list">
    <FrogMenuItem v-for="namespace in namespaceOptions" :key="namespace.id" class="item"
      :class="{ 'selected': namespace.id === selectedNamespaceId }" tabIndex="0"
      :label="namespace.name ?? `${namespace.id}`"
      @click="emit('namespace-switch', namespace?.name ? namespace?.name : `${namespace.id}`)" />
  </ul>
  <FrogButton class="change-env" secondary icon="mdi-server" @click="emit('toggle-env-change')">
    Change Environment
  </FrogButton>
</template>

<script setup lang="ts">
defineProps<{
  selectedNamespaceId?: number
  namespaceOptions: { id: number; name: string }[]
}>()

const emit = defineEmits<{
  (e: 'namespace-switch', namespaceName: string): void
  (e: 'toggle-env-change'): void
}>()
</script>

<style scoped lang="scss">
.heading {
  margin: 0;
}

.namespace-menu-list {
  max-height: 400px;
  overflow-y: auto;
  margin: 8px 0 16px 0;
}

.item {
  &.selected {
    background-color: #007bc0;
    ;

    &.v-list-item--link {
      color: #ffffff !important;
      !important;
    }

    &:hover {
      background-color: #007bc0;
      ;
    }
  }

  &:hover {
    background-color: #d1e4ff;
    ;
  }
}

.change-env {
  display: flex;
  justify-content: center;
  width: 100%;
}
</style>
