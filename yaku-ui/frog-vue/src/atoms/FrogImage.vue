<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div>
    <v-img :alt="alt" :src="path" @error="handleError" @load="handleLoad">
      <template v-if="imageError">
        <img src="" :alt="alt">
      </template>
    </v-img>
    <figcaption v-if="caption">
      {{ caption }}
    </figcaption>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
defineProps<{
  path: string
  alt?: string
  caption?: string
}>()
const imageError = ref(false)
const handleError = () => {
  imageError.value = true
}
const handleLoad = () => {
  imageError.value = false
}
</script>
