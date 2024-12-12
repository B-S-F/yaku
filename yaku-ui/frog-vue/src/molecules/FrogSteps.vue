<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <v-stepper v-model="curStep" :class="{ '-small': small }" alt-labels>
    <v-stepper-header>
      <template v-for="(step, index) in steps" :key="`stepper-item-${index}`">
        <v-stepper-item color="primary" :icon="small ? '' : step.icon" :complete="curStep - 1 > index"
          :title="step.description" :value="small ? '' : index + 1" />
        <v-divider v-if="index !== steps.length - 1" />
      </template>
    </v-stepper-header>
  </v-stepper>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Step } from '../types/Step'

const props = defineProps<{
  small?: boolean
  steps: Array<Step>
  activeStep: number
}>()

const curStep = ref(props.activeStep)

// Watch for changes in activeStep prop and update curStep accordingly
watch(
  () => props.activeStep,
  (newStep) => {
    curStep.value = newStep
  },
)
</script>

<style lang="scss" scoped>
.v-stepper.-small {
  :deep(.v-stepper-header > .v-stepper-item > .v-avatar) {
    height: 1rem !important;
    width: 1rem !important;
  }

  :deep(.v-stepper-header > .v-divider) {
    margin: 30px -67px 0 !important
  }
}
</style>
