<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <v-list-item :to="target" :title="label" value="10" :disabled="isDisabled" :href="href" @click="onClick()">
    <template v-if="iconName" #prepend>
      <FrogIcon :icon="iconName" />
    </template>
    <template v-if="!!iconRight || hasArrowRight || hasArrowDown" #append>
      <FrogIcon :icon="!!iconRight ? iconRight : hasArrowRight ? 'mdi-menu-right' : 'mdi-menu-down'" />
    </template>
  </v-list-item>
</template>

<script setup lang="ts">
import type { MenuItemProps } from '../types'
import { computed } from 'vue'
import FrogIcon from './FrogIcon.vue'

const props = defineProps<MenuItemProps>()

const isBtn = computed(() => props.hasArrowRight || props.hasArrowDown)
const onClick = computed(() => {
  if (isBtn.value && props.btnListener) {
    return props.btnListener
  } else {
    return () => {}
  }
})
</script>
