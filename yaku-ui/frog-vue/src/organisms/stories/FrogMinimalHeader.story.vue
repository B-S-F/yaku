<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
    <Story>
      <Variant title="Default">
        <FrogMinimalHeader appName="App Name" :menuItems="menuItemsExample" :isOpen="true"
          @action="logEvent('action', { value: $event })"
          @side-navigation-open="logEvent('side-navigation-open', { value: $event })"
        />
      </Variant>
      <Variant title="With actions">
        <FrogMinimalHeader appName="App Name" :menuItems="menuItemsExample" :actions="actionsExample"
          @action="logEvent('action', { value: $event })"
          @side-navigation-open="logEvent('side-navigation-open', { value: $event })" />
      </Variant>
      <Variant title="With custom slot after-actions">
        <FrogMinimalHeader appName="App Name" :menuItems="menuItemsExample" :actions="actionsExample"
          @action="logEvent('action', { value: $event })"
          @side-navigation-open="logEvent('side-navigation-open', { value: $event })">
          <template #after-actions>
            <Button>
              Primary
            </Button>
          </template>
        </FrogMinimalHeader>
      </Variant>
      <Variant title="With custom slot sidenavigation-after-actions">
        <FrogMinimalHeader appName="App Name" :menuItems="menuItemsExample" :actions="actionsExample"
          @action="logEvent('action', { value: $event })"
          @side-navigation-open="logEvent('side-navigation-open', { value: $event })">
          <template #sidenavigation-after-items>
            <div style="display: flex; flex-direction: column; justify-content: end; flex-grow: 1;">
              <FrogButton>
                Primary
              </FrogButton>
              <p style="text-align: center;">
                Footnotes
              </p>
            </div>
          </template>
        </FrogMinimalHeader>
      </Variant>
    </Story>
  </template>

  <script setup lang="ts">
import { logEvent } from 'histoire/client'
import Button from '../../atoms/Button.vue'
import FrogMinimalHeader from '../FrogMinimalHeader.vue'
import FrogButton from '../../atoms/FrogButton.vue'

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

const actionsExample = [
  {
    label: 'Lorem Ipsum',
    icon: 'mdi-emoticon-happy',
    url: '#',
  },
  {
    label: 'Lorem Ipsum',
    icon: 'mdi-emoticon-happy',
    url: '#',
    showLabelInHeader: true,
  },
]
</script>
