<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <v-checkbox :id="id" :name="name" :disabled="disabled" :label="label" :model-value="modelValue"
    :indeterminate="indeterminate" @click="updateModelValue" @keypress.enter="updateModelValue" />
</template>
  <script setup lang="ts">
import { useId } from '../composables'

const props = defineProps<{
  name: string
  label?: string
  modelValue?: boolean
  indeterminate?: boolean
  disabled?: boolean
}>()

const emit =
  defineEmits<(e: 'update:modelValue', modelValue: boolean) => void>()

const { $id } = useId()
const id = $id(props.name)

const updateModelValue = () => emit('update:modelValue', !props.modelValue)
</script>
