<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <v-input inputmode="none" :hint="fieldMsg" persistent-hint>
    <template #default>
      <slot />
    </template>
    <template #message>
      <FrogNotificationBar v-if="fieldMsg" :rounded="0" fullWidth show withIcon noContentMargin variant="text"
        :type="notificationType ?? 'neutral'">
        {{ fieldMsg }}
      </FrogNotificationBar>
    </template>
  </v-input>
</template>

<script setup lang="ts">
import FrogNotificationBar from '../atoms/FrogNotificationBar.vue'

defineProps<{
  type?: 'checkbox' | 'dropdown' | 'radio' | 'toggle'
  notificationType?: 'warning' | 'error' | 'success' | 'info' | 'neutral'
  fieldMsg?: string
}>()
</script>
<style lang="scss" scoped>
div.v-input {
  :deep(div.v-input__control>div.v-input>div.v-input__details) {
    padding-top: 0;
    display: none;
  }

  :deep(div.v-input__details) {
    padding-top: 0;
  }

  :deep(div.v-input__details>.v-messages) {
    opacity: 1;
  }
}
</style>
