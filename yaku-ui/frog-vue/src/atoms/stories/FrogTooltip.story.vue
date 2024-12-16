<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <Story>
    <Variant title="default (neutral)">
      <FrogTooltip :model-value="true" label="default" />
    </Variant>
    <Variant title="success">
      <FrogTooltip :model-value="true" title="success" label="Success tooltip" type="success" />
    </Variant>
    <Variant title="error">
      <FrogTooltip :model-value="true" title="error" label="Error tooltip" type="error" />
    </Variant>
    <Variant title="warning">
      <FrogTooltip :model-value="true" title="warning" label="Warning tooltip" type="warning" />
    </Variant>
    <Variant title="dynamic width">
      <FrogTooltip :model-value="true" title="dynamic width" label="Dynamic width tooltip" />
    </Variant>
  </Story>
</template>

<script setup lang="ts">
import FrogTooltip from '../FrogTooltip.vue'
</script>
