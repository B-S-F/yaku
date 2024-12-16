<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <Story>
    <Variant title="Primary">
      <Sticker>
        Label
      </Sticker>
    </Variant>
    <Variant title="Default">
      <Sticker type="secondary">
        Secondary
      </Sticker>
    </Variant>
    <Variant title="Contrast">
      <Sticker type="contrast">
        Contrast
      </Sticker>
    </Variant>
    <Variant title="Turquoise">
      <Sticker type="turquoise">
        Label
      </Sticker>
    </Variant>
    <Variant title="Purple">
      <Sticker type="purple">
        Label
      </Sticker>
    </Variant>
  </Story>
</template>

<script setup lang="ts">
import Sticker from '../Sticker.vue'
</script>

<style scoped lang="scss">
</style>
