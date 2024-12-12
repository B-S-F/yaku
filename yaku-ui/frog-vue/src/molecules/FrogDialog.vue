<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <v-dialog :id="id" min-width="auto" :max-width="maxWidth" width="100%" :persistent="hideCloseBtn"
    :model-value="isOpen" role="dialog" :aria-labelledby="labelledBy" @afterLeave="emit('close')">
    <template #default>
      <v-card>
        <v-toolbar v-if="!hideHeader">
          <template #prepend>
            <FrogIcon v-if="typeof type !== 'undefined'" :icon="`$${type}`" />
          </template>
          <v-toolbar-title>
            {{ title }}
          </v-toolbar-title>
          <v-spacer />
          <v-toolbar-items v-if="!hideCloseBtn">
            <v-btn icon="mdi-close" @click="isOpen = false" />
          </v-toolbar-items>
        </v-toolbar>
        <v-divider />
        <v-card-text :id="describedBy">
          <slot name="headline" />
          <slot name="body" />
        </v-card-text>
        <v-card-actions class="pa-4">
          <slot name="actions" />
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

type DialogProps = {
  id: string
  open: boolean
  type?: 'warning' | 'info' | 'success' | 'error'
  title?: string
  hideCloseBtn?: boolean
  hideHeader?: boolean
  maxWidth?: string
}

const props = withDefaults(defineProps<DialogProps>(), {
  maxWidth: '44rem',
})

const emit = defineEmits<(ev: 'close') => void>()
const isOpen = ref(props.open)
watch(props, ({ open }) => {
  isOpen.value = open
})
const labelledBy = computed(() => `${props.id}-label`)
const describedBy = computed(() => `${props.id}-description`)
</script>

<style lang="scss" scoped>
.v-card-actions:deep(button.v-btn:nth-last-child(2)) {
  margin-left: auto;
}
</style>
