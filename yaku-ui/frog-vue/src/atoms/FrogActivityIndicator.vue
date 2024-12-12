<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
 <v-progress-circular :indeterminate="true" :size="size" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  type?: 'default' | 'large' | 'small'
}>()

const size = computed(() => {
  if (props.type === 'small') {
    return 32
  } else if (props.type === 'large') {
    return 128
  } else {
    return 64
  }
})
</script>
