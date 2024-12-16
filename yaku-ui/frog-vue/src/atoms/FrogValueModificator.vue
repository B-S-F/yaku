<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
    <v-text-field
        :id="id"
        :label="label"
        :model-value="localValue"
    >
    <template #append-inner>
        <v-icon
            icon="mdi-minus"
            @click="decrease"
        />
        <v-icon
            icon="mdi-plus"
            @click="increase"
        />
    </template>
    </v-text-field>

</template>

  <script setup lang="ts">
import { computed } from 'vue'

type ValueModificatorProps = {
  modelValue: number
  label: string
  id: string
  min?: number
  max?: number
}
const props = defineProps<ValueModificatorProps>()
const emit = defineEmits<(e: 'update:modelValue', v: number) => void>()

const localValue = computed({
  get() {
    return props.modelValue.toString()
  },
  set(value) {
    emit('update:modelValue', Number(value))
  },
})

const decrease = () =>
  props.modelValue > (props.min ?? Number.MIN_VALUE)
    ? emit('update:modelValue', props.modelValue - 1)
    : null
const increase = () =>
  props.modelValue < (props.max ?? Number.MAX_VALUE)
    ? emit('update:modelValue', props.modelValue + 1)
    : null
</script>
