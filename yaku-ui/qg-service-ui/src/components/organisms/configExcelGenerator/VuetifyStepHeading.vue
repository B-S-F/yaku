<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <header>
    <div class="heading">
      <h4>{{ heading }}</h4>
      <VuetifyPopoverInfo triggerOnHover attached :label="description" arrowPlacementClass="-top-center"
        pophoverClass="step-heading-popover" />
    </div>
    <div v-if="slots.after" class="after">
      <slot name="after" />
    </div>
  </header>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

defineProps<{
  heading: string
  description: string
}>()

const slots = useSlots()
</script>

<style scoped lang="scss">
header {
  display: flex;
  align-items: start;
  margin-left: 0;
}

.heading {
  display: flex;
  align-items: center;
  column-gap: 12px;
}

:global(.step-heading-popover) {
  --width: 24rem;
}

h4 {
  margin: 0;
}

.after {
  margin-left: auto;
}
</style>
