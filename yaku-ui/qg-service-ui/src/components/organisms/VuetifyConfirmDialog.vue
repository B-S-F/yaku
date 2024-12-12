<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <FrogDialog :id="id" :title="title" open hide-close-btn is-modal :type="type">
    <template #headline>
      {{ headline }}
    </template>
    <template #body>
      <p>{{ content }}</p>
    </template>
    <template #actions>
      <FrogButton @click="emit('confirm')">
        {{ confirmLabel }}
      </FrogButton>
      <FrogButton secondary @click="emit('cancel')">
        {{ cancelLabel }}
      </FrogButton>
    </template>
  </FrogDialog>
</template>

<script setup lang="ts">
type Props = {
  id: string
  type: 'warning' | 'info' | 'success' | 'error'
  title: string
  headline?: string
  content: string
  confirmLabel?: string
  cancelLabel?: string
}
withDefaults(defineProps<Props>(), {
  confirmLabel: 'OK',
  cancelLabel: 'Cancel',
})

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()
</script>
