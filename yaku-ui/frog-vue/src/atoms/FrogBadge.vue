<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <v-badge :inline="inline" :color="type ?? 'info'" tabindex="0" role="status" :aria-live="ariaLive">
    <template #badge>
      <slot name="default" />
    </template>
    <template #default>
      <slot name="extra" />
    </template>
  </v-badge>
</template>

<script setup lang="ts">
type BadgeProps = {
  /** default to info */
  type?: 'warning' | 'error'
  inline?: boolean
  ariaLive?: 'polite' | 'assertive' | 'off'
}

withDefaults(defineProps<BadgeProps>(), {
  ariaLive: 'off',
  inline: true,
})
</script>
