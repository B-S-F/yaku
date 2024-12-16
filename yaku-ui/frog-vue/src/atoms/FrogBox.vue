<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
    <v-card
        v-if="show"
        ref="box"
        :elevation="elevation ?? 6"
        :class="[{ '-show': modal && show }, modal ? 'a-box--modal' : 'a-box']"
    >
        <slot />
    </v-card>
</template>

  <script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { ref } from 'vue'

defineProps<{
  show?: boolean
  modal?: boolean
  elevation?: number
}>()

const emit = defineEmits<(e: 'backgroundClicked') => void>()

const box = ref<HTMLDivElement>()
onClickOutside(box, () => emit('backgroundClicked'))
</script>
