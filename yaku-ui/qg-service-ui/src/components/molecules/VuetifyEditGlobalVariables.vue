<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <section class="global">
    <h2 class="heading text-h6 font-weight-bold">
      Global Variables
    </h2>
    <ul v-if="globalVars.length > 0" class="semantic-list globals-list">
      <li v-for="{ name, value } in globalVars" :key="name" class="global-variable-box">
        <FrogTextInput :id="name" class="global-variable-input" :label="name" :modelValue="value"
          @update:modelValue="emit('update:global-var', name, $event)" />
        <FrogButton integrated icon="mdi-magnify" @click="emit('watch-on', name)" />
      </li>
    </ul>
    <p v-else>
      No global variables is currently defined.
    </p>
  </section>
  <section class="runtime">
    <h2 class="heading text-h6 font-weight-bold">
      Runtime Variables
    </h2>
    <ul v-if="runtimeVars.length > 0" class="semantic-list runtime-list">
      <li v-for="{ name, value } in runtimeVars" :key="name" class="runtime-variable-box">
        <FrogTextInput :id="name" class="runtime-variable-input" :label="name" :modelValue="value"
          @update:modelValue="emit('update:runtime-var', name, $event)" />
        <FrogButton integrated icon="mdi-magnify" @click="emit('watch-on', name)" />
      </li>
    </ul>
    <p v-else>
      No runtime variables is currently defined.
    </p>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  globalVars: Array<{ name: string; value: string }>
  runtimeVars: Array<{ name: string; value: string }>
}>()

const emit = defineEmits<{
  (e: 'update:global-var', name: string, value: string): void
  (e: 'update:runtime-var', name: string, value: string): void
  (e: 'watch-on', name: string): void
}>()
</script>

<style scoped lang="scss">
.heading {
  margin: 0 0 $padding-component-m 0;
}

.global {
  margin-bottom: $padding-component-l;
}

.globals-list,
.runtime-list {
  display: flex;
  flex-direction: column;
  row-gap: $space-component-l;
}

.global-variable-box,
.runtime-variable-box {
  display: flex;
}

.global-variable-input,
.runtime-variable-input {
  flex-grow: 1;
  max-width: 500px;
}
</style>
