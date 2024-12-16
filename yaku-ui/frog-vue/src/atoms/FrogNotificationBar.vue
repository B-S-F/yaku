<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <v-alert v-model="show" :rounded="rounded" :prominent="centerIcon"
    :location="variant === 'banner' ? 'bottom left' : 'top left'" :position="variant === 'banner' ? 'fixed' : undefined"
    :icon="withIcon || customIcon ? customIcon : false" :type="type === 'neutral' ? undefined : type"
    :width="fullWidth ? '100%' : undefined">
    <template #text>
      <slot />
    </template>
  </v-alert>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  type: 'warning' | 'error' | 'success' | 'info' | 'neutral'
  withIcon?: boolean
  rounded?: number
  customIcon?: string
  variant?: 'bar' | 'banner' | 'text'
  show?: boolean
  noContentMargin?: boolean
  fullWidth?: boolean
  centerIcon?: boolean
}>()
const show = ref(props.show)
</script>
