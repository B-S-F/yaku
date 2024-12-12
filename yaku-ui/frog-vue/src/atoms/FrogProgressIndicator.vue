<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <v-progress-linear :indeterminate="isIndeterminate" :max="max" :model-value="value" />
</template>

<script setup lang="ts">
defineProps<{
  max: number
  value?: number
  isIndeterminate?: boolean
}>()
</script>

<!--
    Removed the style section that was in the original ProgressIndicator component
-->
