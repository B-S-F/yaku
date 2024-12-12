<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <Story>
    <Variant title="default">
      <TextInput id="1" modelValue="" />
    </Variant>

    <Variant title="disabled">
      <TextInput id="2" modelValue="" disabled />
    </Variant>

    <Variant title="with model value">
      <TextInput id="3" modelValue="Text input here" />
    </Variant>

    <Variant title="placeholder">
      <div class="wrapper">
        <TextInput id="4" v-model="modelValue" :placeholder="placeholder" />
      </div>
    </Variant>

    <Variant title="placeholder and label">
      <div class="wrapper">
        <TextInput id="5" v-model="modelValue" label="Label" :placeholder="placeholder" />
      </div>
    </Variant>

    <Variant title="password">
      <TextInput id="6" v-model="modelValue" type="password" />
    </Variant>

    <Variant title="search">
      <TextInput id="7" v-model="modelValue" type="search" @search="initiateSearch" />
    </Variant>
  </Story>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import TextInput from '../TextInput.vue'

const modelValue = ref('')
const placeholder = 'Text input here'

watch(modelValue, (newModelValue) => {
  console.log(newModelValue)
})

const initiateSearch = () => {
  console.log(`Searching for ${modelValue.value}...`)
}
</script>
