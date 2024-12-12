<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div class="hoverable-text" @mouseenter="trigger" @mouseleave="close">
    <span ref="labelRef">{{ label }}</span>
    <dialog ref="dialogRef" class="dialog-reset -floating-shadow-s">
      {{ label }}
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, unref } from 'vue'

/**
 * Display a popover if the current text overflows
 * so the whole text can be read.
 */
defineProps<{
  label?: string
}>()

const labelRef = ref<HTMLSpanElement>()
const dialogRef = ref<HTMLDialogElement>()
const top = ref<string>()
const left = ref<string>()

const trigger = () => {
  const node = unref(labelRef)
  const dialog = unref(dialogRef)
  if (!node || !dialog) return
  if (node.scrollWidth > node.clientWidth) {
    const rect = node.getBoundingClientRect()
    top.value = `${rect.y}px`
    left.value = `calc(${rect.left}px)`
    dialog.show()
  }
}
const close = () => {
  dialogRef.value?.close()
}
</script>

<style scoped lang="scss">
.hoverable-text {
  width: 100%;
  overflow: hidden;
}

span {
  display: block;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow-x: hidden;
}

dialog.dialog-reset[open] {
  position: fixed;
  top: v-bind(top);
  left: v-bind(left);
  // adjust to be on top of the hovered text
  transform: translate(#{-$padding-component-s}, calc(-100% - $space-component-s));
  width: fit-content;
  max-width: 90vw;

  padding: $padding-component-s;
  background-color: var(--background);
  outline: none;
}
</style>
