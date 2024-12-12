<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <Story>
    <Variant title="Default">
      <MenuItem label="Label" />
    </Variant>
    <Variant title="Default disabled">
      <MenuItem isDisabled label="Label" />
    </Variant>
    <Variant title="With Divider">
      <MenuItem label="Label" />
      <hr class="a-divider">
    </Variant>
    <Variant title="With Divider disabled">
      <MenuItem isDisabled label="Label" />
      <hr class="a-divider">
    </Variant>
    <Variant title="With Icon">
      <MenuItem label="Label" iconName="emoji-happy" />
    </Variant>
    <Variant title="With Icon disabled">
      <MenuItem isDisabled label="Label" iconName="emoji-happy" />
    </Variant>
    <Variant title="With Icon and Divider">
      <MenuItem label="Label" iconName="emoji-happy" />
      <hr class="a-divider">
    </Variant>
    <Variant title="With Icon and Divider disabled">
      <MenuItem isDisabled label="Label" iconName="emoji-happy" />
      <hr class="a-divider">
    </Variant>
    <Variant title="With arrow right">
      <MenuItem hasArrowRight label="Label" />
    </Variant>
    <Variant title="With arrow right disabled">
      <MenuItem isDisabled hasArrowRight label="Label" />
    </Variant>
    <Variant title="With arrow right and divider">
      <MenuItem hasArrowRight label="Label" />
      <hr class="a-divider">
    </Variant>
    <Variant title="Disabled with arrow right and divider">
      <MenuItem isDisabled hasArrowRight label="Label" />
      <hr class="a-divider">
    </Variant>
    <Variant title="With arrow down">
      <MenuItem hasArrowDown label="Label" />
    </Variant>
    <Variant title="Disabled with arrow down">
      <MenuItem isDisabled hasArrowDown label="Label" />
    </Variant>
    <Variant title="Button listener">
      <MenuItem hasArrowDown label="Label" :btnListener="btnListener" />
    </Variant>
  </Story>
</template>

<script setup lang="ts">
import { logEvent } from 'histoire/client'
import MenuItem from '../MenuItem.vue'

const btnListener = () => logEvent('btnListener', undefined)
</script>
