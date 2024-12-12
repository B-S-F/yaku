<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
    <v-radio :id="localId" :disabled="disabled" type="radio" :name="name" :value="value" :label="label" :model-value="localValue" />
  </template>

  <script setup lang="ts">
import { computed } from 'vue'
import { useId } from '../composables'

const props = defineProps<{
  id: string
  name: string
  disabled?: boolean
  value: string
  modelValue?: string
  label: string
}>()

const emit = defineEmits<(e: 'update:modelValue', v: any) => void>()

const { $id } = useId()
const localId = $id(props.id)

const localValue = computed({
  get() {
    return props.modelValue
  },
  set(v: any) {
    emit('update:modelValue', v)
  },
})
</script>
