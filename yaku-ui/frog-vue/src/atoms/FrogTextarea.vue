<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <v-textarea :id="localId" :model-value="val" :label="label" :disabled="disabled"
    :placeholder="placeholder" :auto-grow="dynamicHeight" @input="val = $event.target.value; emit('update:modelValue', val)" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useId } from '../composables/useId'

type FrogTextareaProps = {
  modelValue: string
  placeholder?: string
  label?: string
  disabled?: boolean
  dynamicHeight?: boolean
  id: string
}
const props = defineProps<FrogTextareaProps>()

const emit = defineEmits<(e: 'update:modelValue', modelValue: string) => void>()

const val = ref(props.modelValue)

const { $id } = useId()
const localId = $id(props.id)

defineExpose({
  localId,
})
</script>
