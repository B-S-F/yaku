<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <Story>
    <Variant title="default">
      <FrogDropzone @dropped="logEvent('dropped', $event)">
        Drop here!
      </FrogDropzone>
    </Variant>
  </Story>
</template>

<script setup lang="ts">
import { logEvent } from 'histoire/client'
import FrogDropzone from '../FrogDropzone.vue'
</script>
