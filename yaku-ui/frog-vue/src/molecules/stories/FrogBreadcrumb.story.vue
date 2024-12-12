<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <Story>
    <Variant title="3 items long">
      <FrogBreadcrumb :items="items" />
    </Variant>
  </Story>
</template>

<script setup lang="ts">
import FrogBreadcrumb from '../FrogBreadcrumb.vue'

const items = [
  {
    label: 'News and Stories',
    href: '#',
  },
  {
    label: 'Internet of Things',
    href: '#',
  },
  {
    label: 'Page Name',
    href: '#',
  },
]
</script>
