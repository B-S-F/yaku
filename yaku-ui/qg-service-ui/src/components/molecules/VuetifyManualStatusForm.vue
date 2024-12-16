<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <form>
    <FrogDropdown id="status-field" label="Status" :model-value="STATUS_ITEMS.find((s) => s.value === props.status)"
      :items="STATUS_ITEMS" @update:modelValue="emit('update:status', $event.value as ManualStatus)" />
    <FrogTextInput id="reason-field" label="Reason" :model-value="reason ?? ''"
      @update:modelValue="emit('update:reason', $event)" />
  </form>
</template>

<script setup lang="ts">
import type { SelectItem } from '~/types'
import type { ManualStatus } from '~/types/RunResult'

const props = defineProps<{
  status?: ManualStatus | string
  reason?: string
}>()

const emit = defineEmits<{
  (e: 'update:status', payload: ManualStatus): void
  (e: 'update:reason', reason: string): void
}>()

const STATUS_ITEMS: SelectItem<ManualStatus>[] = [
  { value: 'GREEN', label: 'Green' },
  { value: 'YELLOW', label: 'Yellow' },
  { value: 'RED', label: 'Red' },
  { value: 'NA', label: 'Na' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'UNANSWERED', label: 'Unanswered' },
] satisfies {
  value: ManualStatus
  label: Capitalize<Lowercase<ManualStatus>>
}[]
</script>


<style scoped lang="scss">
form {
  display: flex;
  flex-direction: column;
  row-gap: $space-component-m;
}
</style>
