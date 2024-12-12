<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <v-container>
    <v-toolbar prominent :class="{ '-search-open': searchOpen }">
      <v-toolbar-title>
        <FrogIcon icon="$vuetify" size="large" aria-label="Logo" />
      </v-toolbar-title>
      <v-spacer />
      <div>
        <template v-if="mdAndUp">
          <FrogButton v-for="link in quicklinks" :key="link.label" :icon="link.icon" integrated
            @click="emit('quicklink', link)">
            {{ link.label }}
          </FrogButton>
        </template>
        <template v-if="smAndDown">
          <FrogButton v-for="link in quicklinks" :key="link.label" :icon="link.icon" integrated
            @click="emit('quicklink', link)" />
        </template>
        <FrogSearch v-if="includeSearch" name="search" :suggestions="[]" @open="searchOpen = true; searchFocused = true"
          @close="searchOpen = false; searchFocused = false" @update:search="emit('search', $event)" />
      </div>
      <FrogButton v-if="mdAndUp" id="menu-activator" :icon="showMenu ? 'mdi-close' : 'mdi-menu'" integrated
        @click="showMenu = !showMenu">
        Menu
      </FrogButton>
      <FrogButton v-if="smAndDown" id="menu-activator" :icon="showMenu ? 'mdi-close' : 'mdi-menu'" integrated
        @update:modelValue="(val: boolean) => showMenu = val" @click="showMenu = !showMenu" />
      <FrogSearchSuggestions v-if="includeSearch && searchSuggestions.length > 0" :model-value="searchFocused"
        :searchSuggestions="searchSuggestions" />
      <FrogNavigation :model-value="showMenu" location="bottom" :selectedLanguage="selectedLanguage"
        :navigation="navigation" :languages="languages"
        @update:selectedLanguage="emit('update:selectedLanguage', $event)" />
    </v-toolbar>
    <v-container fluid>
      <v-row no-gutters class="align-center subbrand">
        <FrogBreadcrumb v-if="mdAndUp" :items="breadcrumbs" />
        <v-col />
        <span class="font-weight-bold">{{ subbrand }}</span>
      </v-row>
    </v-container>
  </v-container>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '../../types'
import type { SearchSuggestion, QuickLink, NavigationEntry } from './types'
import { ref, watch } from 'vue'
import FrogBreadcrumb from '../../molecules/FrogBreadcrumb.vue'

import FrogSearch from './parts/FrogSearch.vue'
import FrogSearchSuggestions from './parts/FrogSearchSuggestions.vue'
import { useDisplay } from 'vuetify'
import FrogNavigation from './parts/FrogNavigation.vue'
import FrogIcon from '../../atoms/FrogIcon.vue'
import FrogButton from '../../atoms/FrogButton.vue'

type HeaderProps = {
  includeSearch?: boolean
  searchSuggestions?: SearchSuggestion[]
  quicklinks?: QuickLink[]
  breadcrumbs?: BreadcrumbItem[]
  subbrand?: string
  navigation?: NavigationEntry[]
  selectedLanguage?: string
  languages?: string[]
  logoLink?: string
}

/**
 * This component is a vue equivalent of the Frok Header in React.
 */
withDefaults(defineProps<HeaderProps>(), {
  searchSuggestions: () => [],
  breadcrumbs: () => [],
  navigation: () => [],
  languages: () => [],
  logoLink: '/',
})

const emit = defineEmits<{
  (e: 'quicklink', quicklink: QuickLink): void
  (e: 'search', value: string): void
  (e: 'update:selectedLanguage', newLanguage: string): void
}>()

const { mdAndUp, smAndDown } = useDisplay()
const searchOpen = ref(false)
const searchFocused = ref(false)
const showMenu = ref(false)
/** close the search bar if the menu is opened */
watch(showMenu, (newVal) => {
  if (newVal) {
    searchOpen.value = false
  }
})
</script>

<style scoped lang="scss">
.v-toolbar {

  &:deep(.v-form) {
    display: none;
  }

  &:deep(.v-field__overlay) {
    opacity: 1;
    background: #fff;
  }
}

.v-toolbar.-search-open {

  &:deep(.v-form) {
    width: 100%;
    display: flex;
    justify-self: center;
    align-self: center;
    top: 0;
    bottom: 0;
    position: absolute;
    right: 0;
    z-index: 1;
    opacity: 1;
  }
}

.subbrand {
  &:deep(.v-breadcrumbs) {
    padding: 0;
    margin-bottom: 0;
  }

  &:deep(.v-breadcrumbs > li) {
    margin-bottom: 0 !important;
  }
}
</style>
