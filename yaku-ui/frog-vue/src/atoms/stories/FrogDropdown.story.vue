<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <Story>
    <Variant title="default">
      <FrogDropdown id="default" :modelValue="itemList[0]" :items="itemList" />
    </Variant>
    <Variant title="disabled">
      <FrogDropdown id="disabled" disabled :modelValue="itemList[0]" :items="itemList" />
    </Variant>
    <Variant title="dynamic width">
      <FrogDropdown id="dynamic-width" dynamicWidth :modelValue="itemList[0]" :items="itemList" />
    </Variant>
    <Variant title="with label">
      <FrogDropdown id="with-label" label="Sweets" :modelValue="itemList[0]" :items="itemList" />
    </Variant>
    <Variant title="disabled with label">
      <FrogDropdown id="disabled" label="Disabled Sweets Dropdown" disabled :modelValue="itemList[0]"
        :items="itemList" />
    </Variant>
    <Variant title="dynamic width with label">
      <FrogDropdown id="dynamic-width" label="Dynamic Width Sweets Dropdown" dynamicWidth :modelValue="itemList[0]"
        :items="itemList" />
    </Variant>
  </Story>
</template>

<script setup lang="ts">
import FrogDropdown from '../FrogDropdown.vue'
const itemList = [
  {
    label: 'Cupcakes',
    value: 'item-1',
  },
  {
    label: 'Jelly beans',
    value: 'item-2',
  },
  {
    label: 'Ice cream',
    value: 'item-3',
  },
  {
    label: 'Donuts',
    value: 'item-4',
  },
  {
    label: 'Cookies',
    value: 'item-5',
  },
  {
    label: 'Chocolate',
    value: 'item-6',
  },
]
</script>
