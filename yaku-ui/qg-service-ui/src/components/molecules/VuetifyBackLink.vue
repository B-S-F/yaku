<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
    <RouterLink class="back-link" :to="to" :arial-label="label ?? 'Back'">
      <FrogIcon class="back-icon" icon="mdi-chevron-left" />
      <span v-if="label" class="nowrap">{{ label }}</span>
    </RouterLink>
  </template>

  <script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

defineProps<{
  to: RouteLocationRaw
  label?: string
}>()
</script>

  <style scoped lang="scss">
  .back-link {
    padding: 12px;
    text-decoration: none;

    .back-icon {
      margin-right: 0px;
    }

    .back-icon+span {
      // value used in the frok
      margin-left: calc(var(--font-size)*var(--line-height)/3);
    }
  }

  .nowrap {
    white-space: nowrap;
  }
  </style>
