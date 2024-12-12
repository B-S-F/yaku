<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
    <Story>
      <Variant title="default">
        <FrogValueModificator id="default" :modelValue="1" label="Modify Value" />
      </Variant>
      <Variant title="with min-max limit">
        <FrogValueModificator id="with min-max limit" :modelValue="1" label="Modify Value" :min="0" :max="10"/>
      </Variant>
    </Story>
  </template>

  <script setup lang="ts">
import FrogValueModificator from '../FrogValueModificator.vue'
</script>
