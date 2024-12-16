<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <v-tabs @update:modelValue="onChange">
      <v-tab v-for="tab in tabs" :key="tab.id" :text="tab.label" :href="tab.href" :disabled="tab.disabled" :prepend-icon="tab.icon" />
  </v-tabs>
</template>


<script setup lang="ts">
import type { Tab } from '../types'

const props = defineProps<{
  selected?: Tab
  tabs?: Tab[]
  hideBorder?: boolean
}>()

const emit = defineEmits<(e: 'update:selected', tab: Tab) => void>()

function onChange(e: any) {
  if (props.tabs) {
    const tab = props.tabs[e]
    if (!tab.disabled) emit('update:selected', tab)
  }
}
</script>
