<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <Story>
    <Variant title="default">
      <FrogImage path="https://via.placeholder.com/400x225" />
    </Variant>
    <Variant title="with alt">
      <FrogImage path="https://bad.src/not/valid" alt="alternate text" />
    </Variant>
    <Variant title="with caption">
      <FrogImage path="https://via.placeholder.com/400x225" caption="caption" />
    </Variant>
  </Story>
</template>

<script setup lang="ts">
import FrogImage from '../FrogImage.vue'
</script>
