<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <Story>
    <Variant title="default">
      <Image path="https://via.placeholder.com/400x225" />
    </Variant>
    <Variant title="with alt">
      <Image path="" alt="alternate text" />
    </Variant>
    <Variant title="with caption">
      <Image path="https://via.placeholder.com/400x225" caption="caption" />
    </Variant>
  </Story>
</template>

<script setup lang="ts">
import Image from '../Image.vue'
</script>
