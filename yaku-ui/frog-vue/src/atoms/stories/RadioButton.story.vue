<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <Story>
    <Variant title="Default">
      <RadioButton id="radio-button-1" v-model="selectedValue" name="default" value="test-default" label="Radio 1" />
    </Variant>
    <Variant title="Disabled unchecked">
      <RadioButton id="radio-button-2" v-model="selectedValue" disabled name="default" value="test-disabled-unchecked"
        label="Radio 2" />
    </Variant>
    <Variant title="Disabled checked">
      <RadioButton id="radio-button-3" v-model="selectedValue" disabled name="default" :value="selectedValue"
        label="Radio 3" />
    </Variant>
  </Story>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { logEvent } from 'histoire/client'
import RadioButton from '../RadioButton.vue'

const selectedValue = ref('')
watch(selectedValue, () =>
  logEvent('update:modelValue', { event: selectedValue.value }),
)
</script>
