<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <Story>
    <Variant title="Determinate progress indicator">
      <ProgressIndicator :max="100" :value="37" />
    </Variant>
    <Variant title="Indeterminate progress indicator">
      <ProgressIndicator isIndeterminate :max="100" />
    </Variant>
  </Story>
</template>

<script setup lang="ts">
import ProgressIndicator from '../ProgressIndicator.vue'
</script>
