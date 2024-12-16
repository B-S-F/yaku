<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <Story>
    <Variant title="Default">
      <FrogSideNavigation v-model:isOpen="isOpen" appName="App name" :menuItems="menuItemsExample" />
    </Variant>
    <Variant title="Item selected">
      <FrogSideNavigation v-model:isOpen="isOpen" appName="App name" :menuItems="menuItemsExample" />
    </Variant>
    <Variant title="After action slot">
      <FrogSideNavigation v-model:isOpen="isOpen" appName="App name" :menuItems="menuItemsExample">
        <template #after-items>
          <div style="display: flex; flex-direction: column; justify-content: flex-end;">
            <Button>After item actions</Button>
            <p style="text-align: center;">
              Footnotes
            </p>
          </div>
        </template>
      </FrogSideNavigation>
    </Variant>
  </Story>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import FrogSideNavigation from '../FrogSideNavigation.vue'

const isOpen = ref(false)
const menuItemsExample = [
  {
    label: 'Login',
    icon: 'mdi-login',
    href: '#',
  },
  {
    label: 'Contact',
    icon: 'mdi-chat',
    href: '#',
  },
  {
    label: 'Group',
    icon: 'mdi-battery',
    subItems: [
      {
        label: 'label 1',
        href: '#',
        icon: 'mdi-chevron-right',
      },
      {
        label: 'label 2',
        href: '#',
        isDisabled: true,
      },
      {
        label: 'label 3',
        href: '#',
      },
    ],
  },
  {
    label: 'Group 2 with some extended labels',
    icon: 'mdi-bicycle-electric',
    subItems: [
      {
        label: 'label 1',
        href: '#',
      },
      {
        label: 'label 2',
        href: '#',
      },
    ],
    isDisabled: true,
  },
  {
    label: 'Group 3 with some extended labels',
    icon: 'mdi-camera-timer',
    subItems: [
      {
        label: 'label 1',
        href: '#',
      },
      {
        label: 'label 2',
        href: '#',
      },
    ],
  },
  {
    label: 'atom',
    icon: 'mdi-atom',
    href: '#',
  },
  {
    label: 'fax',
    icon: 'mdi-fax',
    href: '#',
    isDisabled: true,
  },
]
</script>
