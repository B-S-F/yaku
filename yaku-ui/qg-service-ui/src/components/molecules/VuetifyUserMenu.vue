<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <ul class="semantic-list">
    <FrogMenuItem label="Settings"
      @click="() => { router.push({ name: ROUTE_NAMES.SETTINGS, params: urlContext }); emit('selected') }" />
    <FrogMenuItem label="Logout" tabindex="0" @click="emit('logout'); emit('selected')" />
  </ul>
</template>

<script setup lang="ts">
import { useUrlContext } from '~composables'
import { useRouter } from 'vue-router'
import { ROUTE_NAMES } from '~/router'

const emit = defineEmits<{
  (e: 'selected'): void
  (e: 'logout'): void
}>()

const { urlContext } = useUrlContext()
const router = useRouter()
</script>

<style scoped lang="scss">
ul {
  display: flex;
  flex-flow: column nowrap;
}
</style>
