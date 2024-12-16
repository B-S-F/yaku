<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div class="server-switch">
    <div>
      <span class="text-body-2">Change environment</span>
      <FrogDropdown id="server-switch" v-model="selectedServer" :items="options" />
    </div>
    <div class="actions">
      <FrogButton secondary @click="emit('cancel')">
        Cancel
      </FrogButton>
      <FrogButton :disabled="isConfirmDisabled" @click="onConfirm">
        OK
      </FrogButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SelectItem } from '@B-S-F/frog-vue'
import { computed, ref, watchEffect } from 'vue'

const props = defineProps<{
  currentServer: string
  options: SelectItem[]
}>()

const emit = defineEmits<{
  (e: 'switch', payload: { currentServer: SelectItem }): void
  (e: 'cancel'): void
}>()

const selectedServer = ref<SelectItem | undefined>()
watchEffect(() => {
  selectedServer.value = props.options.find(
    (n) => n.value === props.currentServer,
  )
})

const isConfirmDisabled = computed(() => !selectedServer.value)

const onConfirm = () => {
  if (!selectedServer.value) return
  emit('switch', {
    currentServer: selectedServer.value,
  })
}
</script>

<style scoped lang="scss">
.server-switch {
  display: flex;
  flex-flow: column nowrap;
  row-gap: 16px;
}

.actions {
  padding-top: 8px;
  display: grid;
  grid-template-columns: 2fr 2fr;
  column-gap: 16px;

  &>* {
    height: fit-content
  }
}
</style>
