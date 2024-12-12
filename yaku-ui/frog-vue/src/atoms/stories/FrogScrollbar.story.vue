<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <Story>
      <Variant title="default">
        <FrogScrollbar axis="y" :progress="0.8" />
      </Variant>
  </Story>
</template>

<script setup lang="ts">
import FrogScrollbar from '../FrogScrollbar.vue'
</script>
