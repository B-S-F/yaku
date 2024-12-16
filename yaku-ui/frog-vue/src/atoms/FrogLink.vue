<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div class="a-link" :class="[
      { 'a-link--button': type === 'button-primary' },
      { 'a-link--button-secondary': type === 'button-secondary' },
      { 'a-link--integrated': type === 'integrated' },
  ]">
    <a
      :href="disabled ? undefined : href"
      :target="target ?? '_self'"
      :class="[
        { 'text-disabled': disabled }
        ]">
      <v-icon
        v-if="icon && iconLeft"
        :icon="icon"
      />
      <span>
        {{ label ?? 'I am a link' }}
        <v-icon
          v-if="icon && !iconLeft"
          :icon="icon"
        />
      </span>
    </a>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  disabled?: boolean
  href: string
  icon?: string
  iconLeft?: boolean
  label: string
  type?: 'button-primary' | 'button-secondary' | 'integrated'
  target?: string
}>()
</script>

<style scoped>

.a-link a {
  text-decoration: none;
}

.a-link a:hover {
  text-decoration: underline;
}

.a-link.a-link--button a, .a-link.a-link--button-secondary a {
  text-decoration: none;
}

.a-link a.text-disabled:hover {
  text-decoration: none;
  cursor: default;
}

.text-caption.a-link a,
.text-body-1.a-link a,
.text-body-2.a-link a,
.text-h1.a-link a,
.text-h2.a-link a,
.text-h3.a-link a,
.text-h4.a-link a,
.text-h5.a-link a,
.text-h6.a-link a{
    text-decoration: underline;
}
</style>
