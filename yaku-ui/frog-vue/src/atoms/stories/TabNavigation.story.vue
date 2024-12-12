<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <Story>
    <Variant title="with labels (no borders)">
      <TabNavigation v-model:selected="selected" :tabs="tabsWithLabel" hideBorder />
    </Variant>
    <Variant title="with labels and icons">
      <TabNavigation v-model:selected="selected" :tabs="tabsWithLabelAndIcon" />
    </Variant>
    <Variant title="with icons">
      <TabNavigation v-model:selected="selected" :tabs="tabsWithIcon" />
    </Variant>
    <Variant title="with labels and icons or disabled">
      <TabNavigation v-model:selected="selected" :tabs="tabsWithDisabled" />
    </Variant>
    <Variant title="as links">
      <TabNavigation v-model:selected="selected" :tabs="tabsLinks" />
    </Variant>
  </Story>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useId } from '../../composables'
import type { Tab } from '../../types'
import TabNavigation from '../TabNavigation.vue'

const selected = ref<Tab>()

const getId = () => useId().$id('')

const tabsWithLabel: { id: string; label: string }[] = [
  { id: getId(), label: 'Tab 1' },
  { id: getId(), label: 'Tab 2' },
  { id: getId(), label: 'Tab 3' },
  { id: getId(), label: 'This is a Tab with a long label' },
  { id: getId(), label: 'This is another Tab with a long label' },
  { id: getId(), label: 'This is the last Tab with a long label' },
]

const tabsWithLabelAndIcon: { id: string; label: string; icon: string }[] = [
  { id: getId(), label: 'Tab 1', icon: 'emoji-happy' },
  { id: getId(), label: 'Tab 2', icon: 'emoji-happy' },
  { id: getId(), label: 'Tab 3', icon: 'emoji-happy' },
  {
    id: getId(),
    label: 'This is a Tab with a long label',
    icon: 'emoji-happy',
  },
  {
    id: getId(),
    label: 'This is another Tab with a long label',
    icon: 'emoji-happy',
  },
  {
    id: getId(),
    label: 'This is the last Tab with a long label',
    icon: 'emoji-happy',
  },
]

const tabsWithIcon: { id: string; icon: string }[] = [
  { id: getId(), icon: 'emoji-happy' },
  { id: getId(), icon: 'battery-2' },
  { id: getId(), icon: 'books' },
  { id: getId(), icon: 'clock' },
  { id: getId(), icon: 'delivery' },
  { id: getId(), icon: 'externallink' },
]

const tabsWithDisabled: {
  id: string
  label: string
  icon?: string
  disabled?: boolean
}[] = [
  { id: getId(), label: 'Tab 1', icon: 'emoji-happy' },
  { id: getId(), label: 'Tab 2', icon: 'emoji-happy', disabled: true },
  { id: getId(), label: 'Tab 3', icon: 'emoji-happy' },
  {
    id: getId(),
    label: 'This is a Tab with a long label',
    icon: 'emoji-happy',
    disabled: true,
  },
  {
    id: getId(),
    label: 'This is another Tab with a long label',
    icon: 'emoji-happy',
  },
  {
    id: getId(),
    label: 'This is the last Tab with a long label',
    icon: 'emoji-happy',
  },
]

const tabsLinks: {
  id: string
  label: string
  icon?: string
  disabled?: boolean
  href: string
}[] = [
  { id: getId(), label: 'Tab 1', icon: 'emoji-happy', href: '#1' },
  {
    id: getId(),
    label: 'Tab 2',
    icon: 'emoji-happy',
    href: '#2',
    disabled: true,
  },
  { id: getId(), label: 'Tab 3', icon: 'emoji-happy', href: '#3' },
  {
    id: getId(),
    label: 'This is a Tab with a long label',
    icon: 'emoji-happy',
    href: '#4',
    disabled: true,
  },
  {
    id: getId(),
    label: 'This is another Tab with a long label',
    icon: 'emoji-happy',
    href: '#5',
  },
  {
    id: getId(),
    label: 'This is the last Tab with a long label',
    icon: 'emoji-happy',
    href: '#6',
  },
]
</script>
