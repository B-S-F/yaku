<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <v-text-field :id="localId" v-model="localValue" :hide-details="hideDetails" :disabled="disabled" :label="label"
    :type="inputType" :placeholder="placeholder" :class="containerClass"
    @blur="(event: any) => emit('focusout', event)">
    <template #append-inner>
      <FrogButton v-if="(showX || inputType === 'search') && localValue && showX !== false" integrated icon="mdi-close"
        @click="() => localValue = ''" />
      <FrogButton v-if="inputType === 'search'" integrated icon="mdi-magnify" @click="() => emit('search')" />
      <FrogButton v-else-if="isPassword" integrated :icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
        @click="handleVisibility" />
      <slot name="after" />
    </template>
  </v-text-field>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useId } from '../composables/useId'
import FrogButton from './FrogButton.vue'

const props = defineProps<{
  modelValue: string
  hideDetails?: boolean
  label?: string
  id: string
  type?: string
  containerClass?: string
  showX?: boolean
  placeholder?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
  (e: 'search'): void
  (e: 'focusout', payload: FocusEvent): void
}>()

const { $id } = useId()
const localId = $id(props.id)

const localValue = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emit('update:modelValue', value.toString())
  },
})

defineExpose({
  localId,
})

const isPassword = props.type === 'password'
const visible = ref(!isPassword)

const inputType = computed(() => {
  if (isPassword) {
    return visible.value ? 'text' : 'password'
  } else {
    return props.type
  }
})
const handleVisibility = () => {
  visible.value = !visible.value
}
</script>
