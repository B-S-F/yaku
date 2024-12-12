<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <v-form autoComplete="off">
    <FrogTextInput id="1" v-model="value" hideDetails type="search" placeholder="Search"
      :showX="false">
      <template #after>
        <FrogButton integrated icon="mdi-close" @click="emit('close')" />
      </template>
    </FrogTextInput>
  </v-form>
  <FrogButton v-if="mdAndUp" integrated icon="mdi-magnify" aria-haspopup="true" aria-expanded="false"
    @click="emit('open')">
    <template #default>
      Search
    </template>
  </FrogButton>
  <FrogButton v-if="smAndDown" integrated icon="mdi-magnify" aria-haspopup="true" aria-expanded="false"
    @click="emit('open')" />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import FrogButton from '../../../atoms/FrogButton.vue'
import FrogTextInput from '../../../atoms/FrogTextInput.vue'
import type { SearchSuggestion } from '../types'
import { useDisplay } from 'vuetify'

defineProps<{
  name: string
  suggestions: SearchSuggestion[]
}>()

const emit = defineEmits<{
  (e: 'open'): void
  (e: 'close'): void
  (e: 'focus', event: Event): void
  (e: 'blur'): void
  (e: 'update:search', search: string): void
}>()

const { mdAndUp, smAndDown } = useDisplay()
const value = ref('')
watch(value, (newVal) => emit('update:search', newVal))
</script>

<style scoped>
/** patch: avoid the form of Header.vue to overflow with mobile views instead of the react realtime computation */
.v-form {
  max-width: 100vw;
}
</style>
