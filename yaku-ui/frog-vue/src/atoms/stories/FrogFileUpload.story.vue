<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <Story>
    <Variant title="default">
      <FrogFileUpload />
    </Variant>
    <Variant title="ability to choose multiple">
      <FrogFileUpload :multiple="true" />
    </Variant>
    <Variant title="only accepting specific extension">
      <FrogFileUpload accept=".pdf" />
    </Variant>
    <Variant title="has chosen file">
      <FrogFileUpload :hasFile="true" />
    </Variant>
    <Variant title="chosen file with label">
      <FrogFileUpload :hasFile="true" fileLabel="sweets_list.txt" />
    </Variant>
  </Story>
</template>

<script setup lang="ts">
import FrogFileUpload from '../FrogFileUpload.vue'
</script>
