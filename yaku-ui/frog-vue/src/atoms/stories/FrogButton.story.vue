<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <Story>
    <Variant title="primary label">
      <FrogButton>
        Button
      </FrogButton>
    </Variant>

    <Variant title="secondary label">
      <FrogButton :secondary="true">
        Button
      </FrogButton>
    </Variant>

    <Variant title="tertiary label">
      <FrogButton :tertiary="true">
        Button
      </FrogButton>
    </Variant>

    <Variant title="integrated label">
      <FrogButton :integrated="true">
        Button
      </FrogButton>
    </Variant>

    <Variant title="primary label icon">
      <FrogButton icon="mdi-home">
        Button
      </FrogButton>
    </Variant>

    <Variant title="primary icon">
      <FrogButton icon="mdi-home" />
    </Variant>

    <Variant title="primary label fixed width">
      <FrogButton fixed>
        Button with fixed width
      </FrogButton>
    </Variant>

    <Variant title="primary icon fixed">
      <FrogButton icon="mdi-home" fixed />
    </Variant>

    <Variant title="primary label disabled">
      <FrogButton :disabled="true">
        Button
      </FrogButton>
    </Variant>

    <Variant title="primary icon disabled">
      <FrogButton :disabled="true" icon="mdi-home" />
    </Variant>

    <Variant title="close">
      <FrogButton :integrated="true" icon="mdi-close" />
    </Variant>
    <Variant title="with right content">
      <FrogButton icon="mdi-home">
        Manage Approval
        <template #right-content>
          Famous
        </template>
      </FrogButton>
    </Variant>
  </Story>
</template>

<script setup lang="ts">
import FrogButton from '../FrogButton.vue'
</script>
