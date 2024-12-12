<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div class="a-box--modal -show neutral-modal-bg">
    <FrogDialog id="what-to-do-here" :open="showDialog" title="What to do here?" @close="emit('close')">
      <template #headline>
        Map the columns using drag and drop
      </template>
      <template #body>
        <video class="video" :autoplay="autoplay" loop>
          <source src="/assets/mapping.mp4" type="video/mp4">
          Your browser does not support the video tag.
        </video>
        <p>
          Drag and drop an attribute onto a column to assign it. Each attribute provides a tooltip with more information
          about its purpose. The filter attribute can be activated separately if needed.
        </p>
        <FrogCheckbox class="show-preference" name="mapping-helper-show-preference" :model-value="hideInitial"
          label="Do not show again" @update:model-value="emit('update:hideInitial', $event)" />
      </template>
      <template #actions>
        <button type="button" class="a-button a-button--primary -without-icon" data-frok-action="confirm"
          data-cy="close-mapping-helper-dialog" @click="emit('close')">
          <span class="a-button__label">Close</span>
        </button>
      </template>
    </FrogDialog>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  hideInitial?: boolean
  showDialog: boolean
}>()

const emit = defineEmits<{
  (ev: 'close'): void
  (e: 'update:hideInitial', newVal: boolean): void
}>()

const autoplay = import.meta.env.MODE !== 'dev:mock'
</script>

<style scoped lang="scss">
.a-box--modal {
  z-index: 2;
}

.neutral-modal-bg {
  backdrop-filter: none;
  background-color: transparent;
}

.video {
  border: 1px solid #000000;
  width: 100%;
}

.show-preference {
  margin-top: 36px;
}
</style>
