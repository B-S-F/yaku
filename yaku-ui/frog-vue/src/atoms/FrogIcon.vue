<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<script lang="ts" setup>
type IconProps = {
  icon: string
  title?: string
  size?: 'x-small' | 'small' | 'default' | 'large' | 'x-large'
}
withDefaults(defineProps<IconProps>(), {
  size: 'default',
})
</script>

<template>
  <v-icon class="a-icon" :size="size" :icon="icon" :title="title" />
</template>
