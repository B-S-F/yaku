<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
    <Story>
        <Variant title="default">
          <FrogActivityIndicator />
        </Variant>

        <Variant title="small">
          <FrogActivityIndicator type="small" />
        </Variant>

        <Variant title="large">
          <FrogActivityIndicator type="large" />
        </Variant>
    </Story>
  </template>

<script setup lang="ts">
import FrogActivityIndicator from '../FrogActivityIndicator.vue'
</script>
