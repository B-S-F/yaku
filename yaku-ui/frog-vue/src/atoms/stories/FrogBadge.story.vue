<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <Story>
    <Variant title="Default">
      <FrogBadge>
        1
      </FrogBadge>
    </Variant>
    <Variant title="Warning">
      <FrogBadge type="warning">
        1
      </FrogBadge>
    </Variant>
    <Variant title="Error">
      <FrogBadge type="error">
        1
      </FrogBadge>
    </Variant>
    <Variant title="Long text">
      <FrogBadge type="error">
        A badge with an unlimited label text lorem ipsum
      </FrogBadge>
    </Variant>
    <Variant title="On button">
      <v-btn variant="plain" size="x-large">
        <FrogBadge type="error" :inline="false">
          2
          <template #extra>
            <FrogIcon icon="mdi-bell-outline" />
          </template>
        </FrogBadge>
      </v-btn>
    </Variant>
    <Variant title="Inline">
      <p style="display: flex; align-items: center;">
        <span>Lorem ipsum dolor sit amet.</span>
        <FrogBadge>
          lorem ipsum
        </FrogBadge>
      </p>
    </Variant>
  </Story>
</template>

<script setup lang="ts">
import FrogBadge from '../FrogBadge.vue'
import FrogIcon from '../FrogIcon.vue'
</script>
