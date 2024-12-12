<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <v-btn :disabled="disabled" :rounded="fixed && !hasLabelSlot ? true : undefined" density="default"
    :width="fixed ? '8rem' : undefined" :icon="!hasLabelSlot ? icon : undefined"
    :prepend-icon="hasLabelSlot && !iconRight ? icon : undefined" :color="color"
    :variant="native ? 'flat' : secondary ? 'outlined' : tertiary ? 'text' : integrated ? 'plain' : 'flat'"
    :append-icon="iconRight && icon ? icon : undefined">
    <template v-if="hasLabelSlot" #default>
      <slot />
    </template>
    <template v-if="hasRightSlot" #append>
      <slot name="right-content" />
    </template>
  </v-btn>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSlots } from 'vue'

type ButtonProps = {
  color?: 'primary' | string
  native?: boolean
  secondary?: boolean
  tertiary?: boolean
  integrated?: boolean
  disabled?: boolean
  icon?: string
  iconTitle?: string
  iconRight?: boolean
  fixed?: boolean
}
withDefaults(defineProps<ButtonProps>(), {
  color: 'primary',
})
const hasLabelSlot = computed(() => slots.default && slots.default())
const hasRightSlot = computed(
  () => slots['right-content'] && slots['right-content'](),
)
const slots = useSlots()
</script>

<style lang="scss" scoped>
.v-btn {
  :deep(span.v-btn__content) {
    text-align: left;
    justify-content: flex-start;
    text-overflow: ellipsis;
    display: inline;
    overflow: hidden;
  }
}

.v-btn--density-default {
  height: calc(var(--v-btn-height) + 12px) !important;
}
</style>
