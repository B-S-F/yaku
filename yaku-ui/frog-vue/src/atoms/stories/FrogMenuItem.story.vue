<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <Story>
    <Variant title="Default">
      <FrogMenuItem label="Label" />
    </Variant>
    <Variant title="Default disabled">
      <FrogMenuItem isDisabled label="Label" />
    </Variant>
    <Variant title="With Divider">
      <FrogMenuItem label="Label" />
      <v-divider />
    </Variant>
    <Variant title="With Divider disabled">
      <FrogMenuItem isDisabled label="Label" />
      <v-divider />
    </Variant>
    <Variant title="With Icon">
      <FrogMenuItem label="Label" iconName="mdi-home" />
    </Variant>
    <Variant title="With Icon disabled">
      <FrogMenuItem isDisabled label="Label" iconName="mdi-home" />
    </Variant>
    <Variant title="With Icon and Divider">
      <FrogMenuItem label="Label" iconName="mdi-home" />
      <v-divider />
    </Variant>
    <Variant title="With Icon and Divider disabled">
      <FrogMenuItem isDisabled label="Label" iconName="mdi-home" />
      <v-divider />
    </Variant>
    <Variant title="With arrow right">
      <FrogMenuItem hasArrowRight label="Label" />
    </Variant>
    <Variant title="With arrow right disabled">
      <FrogMenuItem isDisabled hasArrowRight label="Label" />
    </Variant>
    <Variant title="With arrow right and divider">
      <FrogMenuItem hasArrowRight label="Label" />
      <hr class="a-divider">
    </Variant>
    <Variant title="Disabled with arrow right and divider">
      <FrogMenuItem isDisabled hasArrowRight label="Label" />
      <hr class="a-divider">
    </Variant>
    <Variant title="With arrow down">
      <FrogMenuItem hasArrowDown label="Label" />
    </Variant>
    <Variant title="Disabled with arrow down">
      <FrogMenuItem isDisabled hasArrowDown label="Label" />
    </Variant>
    <Variant title="Button listener">
      <FrogMenuItem hasArrowDown label="Label" :btnListener="btnListener" />
    </Variant>
  </Story>
</template>

<script setup lang="ts">
import { logEvent } from 'histoire/client'
import FrogMenuItem from '../FrogMenuItem.vue'

const btnListener = () => logEvent('btnListener', undefined)
</script>
