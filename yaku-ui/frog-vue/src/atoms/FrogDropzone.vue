<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div :data-active="active" @dragenter.prevent="setActive" @dragover.prevent="setActive"
    @dragleave.prevent="setInactive" @drop.prevent="onDrop">
    <slot :dropZoneActive="active" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const emit = defineEmits<(e: 'dropped', payload: DragEvent) => void>()
const active = ref(false)
const inActiveTimeout = ref(0)
// setActive and setInactive use timeouts, so that when you drag an item over a child element,
// the dragleave event that is fired won't cause a flicker. A few ms should be plenty of
// time to wait for the next dragenter event to clear the timeout and set it back to active.
function setActive() {
  active.value = true
  clearTimeout(inActiveTimeout.value)
}
function setInactive() {
  inActiveTimeout.value = window.setTimeout(() => {
    active.value = false
  }, 50)
}
function onDrop(e: DragEvent) {
  setInactive()
  if (!e.dataTransfer) return
  emit('dropped', e)
}
</script>
