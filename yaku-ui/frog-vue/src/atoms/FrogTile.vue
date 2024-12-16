<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
    <div class="a-tile" :class="{
      '-secondary': secondary
    }">
      <slot />
    </div>
  </template>

  <script lang="ts" setup>
defineProps<{
  secondary?: boolean
}>()
</script>
