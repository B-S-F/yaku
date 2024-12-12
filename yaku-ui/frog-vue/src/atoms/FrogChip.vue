<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <v-chip :id="id" :disabled="disabled" :draggable="dragged" :closable="removable" role="button"
    :aria-labelledby="labelledBy">
    <template #prepend>
      <slot name="before" />
    </template>
    {{ label }}
    <template #append>
      <slot name="after" />
    </template>
  </v-chip>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type ChipProps = {
  label: string
  id: string
  selected?: boolean
  disabled?: boolean
  dragged?: boolean
  removable?: boolean
}

const props = defineProps<ChipProps>()

const labelledBy = computed(() => `chip-label-id-${props.id}`)
</script>
