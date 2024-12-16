<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <Story>
    <Variant title="default 5 steps">
      <FrogSteps :steps="steps" :activeStep="1" />
    </Variant>
    <Variant title="default 5 steps reached third step">
      <FrogSteps :steps="steps" :activeStep="3" />
    </Variant>
    <Variant title="default 5 steps with icons">
      <FrogSteps :steps="stepsWithIcons" :activeStep="1" />
    </Variant>
    <Variant title="small 5 steps">
      <FrogSteps :steps="steps" :activeStep="1" small />
    </Variant>
    <Variant title="small 5 steps without labels">
      <FrogSteps :steps="stepsWithoutLabels" :activeStep="1" small />
    </Variant>
  </Story>
</template>

<script setup lang="ts">
import FrogSteps from '../FrogSteps.vue'
const steps = [
  {
    label: '1',
    description: 'Step 1',
  },
  {
    label: '2',
    description: 'Step 2',
  },
  {
    label: '3',
    description:
      'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam.',
  },
  {
    label: '4',
    description: 'Step 4',
  },
  {
    label: '5',
    description: 'Step 5',
  },
]

const stepsWithIcons = [
  {
    label: '1',
    description: 'Step 1',
    icon: 'mdi-home',
  },
  {
    label: '2',
    description: 'Step 2',
    icon: 'mdi-account',
  },
  {
    label: '3',
    description:
      'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam.',
    icon: 'mdi-emoticon-happy-outline',
  },
  {
    label: '4',
    description: 'Step 4',
    icon: 'mdi-calendar-blank',
  },
  {
    label: '5',
    description: 'Step 5',
    icon: 'mdi-file-document-alert-outline',
  },
]

const stepsWithoutLabels = Array(5).fill({})
</script>
