<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div class="d-inline-flex ga-2">
    <v-label v-if="leftLabel" :text="leftLabel" />
    <v-switch :id="id" :disabled="disabled" :model-value="modelValue ?? false" color="primary" :hide-details="true"
      @update:model-value="$emit('update:modelValue', $event)" />
    <v-label v-if="rightLabel" :text="rightLabel" />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  id: string
  modelValue: boolean
  disabled?: boolean
  leftLabel?: string
  rightLabel?: string
}>()

defineEmits<(e: 'update:modelValue', v: boolean | null) => void>()
</script>
