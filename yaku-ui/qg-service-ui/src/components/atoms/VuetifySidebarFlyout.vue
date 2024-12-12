<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <Teleport to="#app">
    <dialog v-bind="$attrs" ref="dialogRef" class="dialog-reset elevation-1">
      <div v-if="withEmptyInitialFocus" class="hide-initial-focus" tabindex="0" />
      <slot />
    </dialog>
  </Teleport>
</template>

<script setup lang="ts">
import { onClickOutside, useEventListener } from '@vueuse/core'
import { computed, ref, watchEffect } from 'vue'

const props = defineProps<{
  trigger: HTMLElement | null | undefined
  open: boolean
  withEmptyInitialFocus?: boolean
}>()

const emit = defineEmits<(e: 'update:open', newValue: boolean) => void>()

const dialogRef = ref<HTMLDialogElement | null>(null)
const triggerRef = computed(() => props.trigger)

const toggle = ({ close }: { close?: boolean } = {}) => {
  if (dialogRef.value?.open || close) {
    dialogRef.value?.close()
  } else {
    dialogRef.value?.show()
  }
}
watchEffect(() => toggle({ close: !props.open }))

useEventListener(document, 'keydown', ({ key }) => {
  if (key === 'Escape') emit('update:open', false)
})

onClickOutside(
  dialogRef,
  () => {
    if (props.open) emit('update:open', false)
  },
  { ignore: [triggerRef] },
)
</script>

<style scoped lang="scss">
.hide-initial-focus {
  position: absolute;
  width: 1px;
  height: 0;

  &:focus {
    outline: 0;
  }
}
</style>
