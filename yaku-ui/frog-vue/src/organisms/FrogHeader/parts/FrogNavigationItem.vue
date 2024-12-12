<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <v-list-item v-if="!entry.subNavigation || entry.subNavigation?.length === 0">
    <a :href="entry.href" :target="entry.isExternal ? '_blank' : '_self'" :tabindex="isOpen ? 0 : -1">
      <span>{{ entry.label }}</span>
    </a>
  </v-list-item>
  <v-list-item v-else>
    <FrogButton class="px-0" integrated @click="onOpen">
      {{ entry.label }}
      <template #right-content>
        <FrogIcon icon="mdi-chevron-right" />
      </template>
    </FrogButton>
  </v-list-item>
</template>

<script setup lang="ts">
import type { NavigationEntry } from '../types'
import FrogButton from '../../../atoms/FrogButton.vue'
import FrogIcon from '../../../atoms/FrogIcon.vue'
import { ref, watch } from 'vue'

type NavigationItemProps = {
  isOpen?: boolean
  entry: NavigationEntry
  level?: number
}

const props = withDefaults(defineProps<NavigationItemProps>(), {
  level: 0,
})

const emit = defineEmits<{
  (e: 'open'): void
  (e: 'close'): void
}>()

const isOpenAt = ref<number>()
watch(
  () => props.isOpen,
  (newVal) => {
    if (!newVal) {
      isOpenAt.value = undefined
    }
  },
)

const onOpen = () => {
  emit('open')
}
</script>
