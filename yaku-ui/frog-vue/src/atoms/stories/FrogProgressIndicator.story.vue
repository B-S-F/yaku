<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
    <Story>
      <Variant title="Determinate progress indicator">
        <FrogProgressIndicator :max="100" :value="37" />
      </Variant>
      <Variant title="Indeterminate progress indicator">
        <FrogProgressIndicator isIndeterminate :max="100" />
      </Variant>
    </Story>
  </template>

  <script setup lang="ts">
import FrogProgressIndicator from '../FrogProgressIndicator.vue'
</script>
