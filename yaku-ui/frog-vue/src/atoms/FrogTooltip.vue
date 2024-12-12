<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <v-tooltip v-bind="$attrs"
    :content-class="{ 'bg-error': type === 'error', 'bg-success': type === 'success', 'bg-warning': type === 'warning' }"
    :text="label" :width="width" />
</template>

<script setup lang="ts">
import type { TooltipProps } from '../types'

defineProps<TooltipProps>()
</script>
