<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div class="dev-banner bg-blue-lighten-3">
    <FrogIcon class="icon" icon="mdi-information-outline" />
    <span v-if="ui"><span>UI</span>: {{ ui }}</span>
    <span v-if="api"><span>API</span>: {{ api }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  ui: string | undefined
  api: string | undefined
}>()
</script>

<style scoped lang="scss">
.dev-banner {
  display: flex;
  align-items: center;
  padding-inline: $padding-component-s;
}

.icon {
  margin-right: $space-component-s;
}

span {
  white-space: nowrap;
}

span+span::before {
  content: "|";
  margin-inline: $space-component-xs;
}
</style>
