<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <v-breadcrumbs :items="vItems">
    <template #divider>
      <FrogIcon icon="mdi-chevron-right" />
    </template>
  </v-breadcrumbs>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '../types'
import FrogIcon from '../atoms/FrogIcon.vue'

const props = defineProps<{
  items: BreadcrumbItem[]
}>()
const vItems = props.items.map((item) => ({
  title: item.label,
  href: item.href,
}))
</script>

<style lang="scss" scoped>
ul.v-breadcrumbs {
  :deep(li.v-breadcrumbs-item:before) {
    display: none;
  }

  :deep(li.v-breadcrumbs-divider:before) {
    display: none;
  }

  :deep(li.v-breadcrumbs-item:last-of-type) {
    margin-bottom: 1rem;
  }
}
</style>
