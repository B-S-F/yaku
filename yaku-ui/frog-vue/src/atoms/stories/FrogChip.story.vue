<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <Story>
    <Variant title="default">
      <FrogChip id="default" label="Label" />
    </Variant>

    <Variant title="long">
      <FrogChip id="long-chip" label="Longer Label" :removable="true" />
    </Variant>
  </Story>
</template>

<script setup lang="ts">
import FrogChip from '../FrogChip.vue'
</script>
