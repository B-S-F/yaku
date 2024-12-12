<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<!-- eslint-disable vue/no-v-html -->
<template>
  <v-menu width="100%" :close-on-content-click="false" transition="slide-y-transition" location="bottom" activator="parent"
     @update:modelValue="(value) => emit('update:modelValue', value)">
    <v-container>
      <v-list elevation="10">
        <v-list-item v-for="suggestion, index in searchSuggestions" :key="index">
          <a class="text-decoration-none" tabIndex="-1" label=" " :href="suggestion.href">
            <span v-html="renderSuggestionLinkText(suggestion.text, suggestion.highlight)" />
          </a>
        </v-list-item>
        <v-list-item>
          <a class="text-decoration-none" label="All Results" level="primary" href="/" tabIndex="-1">
            <span>All Results</span>
          </a>
        </v-list-item>
      </v-list>
    </v-container>
  </v-menu>
</template>

<script setup lang="ts">
import type { SearchSuggestion } from '../types'

defineProps<{
  searchSuggestions: SearchSuggestion[]
}>()

const emit = defineEmits<(e: 'update:modelValue', val: boolean) => void>()

const renderSuggestionLinkText = (text: string, highlight?: string): string =>
  highlight
    ? text.replace(
        highlight,
        `<span class="font-weight-bold">${highlight}</span>`,
      )
    : text
</script>
