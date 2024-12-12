<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <v-toolbar compact :class="{ '-search-open': isOpen }">
    <v-toolbar-title>
      <FrogButton icon="mdi-menu" integrated @click="isSideNavigationOpen = !isSideNavigationOpen" />
    </v-toolbar-title>
    <v-spacer />
    <slot name="before-actions" />
    <template v-if="mdAndUp">
      <FrogButton v-for="action in actions" :key="action.label" :icon="action.icon" tertiary
        @click="$emit('action', action)">
        <span v-if="action.showLabelInHeader">{{ action.label }}</span>
      </FrogButton>
    </template>
    <slot name="after-actions" />
    <a v-if="mdAndUp" :href="logoLink ?? '/'" class="px-5">
      <FrogIcon icon="$vuetify" size="large" aria-label="Logo" />
    </a>
  </v-toolbar>
  <FrogSideNavigation :isOpen="isSideNavigationOpen" :appName="appName" :menuItems="menuItems"
    @update:isOpen="(val: boolean) => isSideNavigationOpen = val">
    <template #sidenavigation-nav-items>
      <slot name="minimalheader-nav-items" />
    </template>
    <template #after-items>
      <slot name="sidenavigation-after-items" />
    </template>
  </FrogSideNavigation>
</template>

<script setup lang="ts">
import type { ContextMenuLink } from '../types/ContextMenuLink'
import type { SideNavigationProps } from '../types/SideNavigationProps'
import FrogSideNavigation from '../molecules/FrogSideNavigation.vue'
import FrogButton from '../atoms/FrogButton.vue'
import FrogIcon from '../atoms/FrogIcon.vue'
import { ref, watch } from 'vue'
import { useDisplay } from 'vuetify'

type Action = {
  label: string
  icon: string
  url: string
  showLabelInHeader?: boolean
}

type MinimalHeaderProps = SideNavigationProps & {
  title?: string
  actions?: Action[]
  links?: ContextMenuLink[]
  logoLink?: string
}

const props = defineProps<MinimalHeaderProps>()

const emit = defineEmits<{
  (e: 'action', action: Action): void
  (e: 'side-navigation-open', value: boolean): void
}>()

const { mdAndUp } = useDisplay()
const isSideNavigationOpen = ref(false)
watch(isSideNavigationOpen, (newVal) => emit('side-navigation-open', newVal))

const contextMenuLinksFromActions: ContextMenuLink[] | undefined =
  props.actions?.map(({ label, icon, url }) => ({
    label,
    iconName: icon,
    href: url,
  }))
const findActionOfLink = (link: ContextMenuLink) =>
  props.actions?.find((a) => a.label === link.label)
const onContextMenuAction = (link: ContextMenuLink) => {
  const actionCandidate = findActionOfLink(link)
  if (actionCandidate) emit('action', actionCandidate)
}
</script>
