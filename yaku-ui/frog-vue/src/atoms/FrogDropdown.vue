<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <v-select :id="id" v-model="localValue" hide-details :max-width="dynamicWidth ? 'fit-content' : '100%'" center-affix
    item-title="label" item-value="value" :items="items" :disabled="disabled" :label="label" />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { SelectItem } from '../types/SelectItem'

type SelectProps = {
  modelValue?: SelectItem | null
  label?: string
  id: string
  items?: SelectItem[] | readonly SelectItem[]
  disabled?: boolean
  dynamicWidth?: boolean
}

const props = defineProps<SelectProps>()

const emit =
  defineEmits<(e: 'update:modelValue', modelValue: SelectItem) => void>()
const localValue = ref(props.modelValue?.value)

watch(localValue, (newValue, oldValue) => {
  if (newValue === oldValue) return
  const item = props.items?.find((val) => val.value === newValue)
  if (typeof item !== 'undefined') emit('update:modelValue', item)
})

watch(props, ({ modelValue }) => {
  localValue.value = modelValue?.value
})
</script>
<style lang="scss">
// NOTE: left is because of a bug in vuetify. See https://github.com/vuetifyjs/vuetify/issues/19732
// TODO: this causes all dropdowns to stay on the far left, not sure how to fix this for now
// .v-overlay-container>div.v-overlay>div.v-overlay__content.v-select__content {
//   left: 0px !important;
// }</style>
