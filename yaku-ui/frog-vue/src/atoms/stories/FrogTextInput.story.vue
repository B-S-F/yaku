<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <Story>
    <Variant title="default">
      <FrogTextInput id="1" modelValue="" />
    </Variant>

    <Variant title="disabled">
      <FrogTextInput id="2" modelValue="" disabled />
    </Variant>

    <Variant title="with model value">
      <FrogTextInput id="3" modelValue="With Model Value" />
    </Variant>

    <Variant title="placeholder">
      <div class="wrapper">
        <FrogTextInput id="4" v-model="modelValue" :placeholder="placeholder" />
      </div>
    </Variant>

    <Variant title="placeholder and label">
      <div class="wrapper">
        <FrogTextInput id="5" v-model="modelValue" label="Label" :placeholder="placeholder" />
      </div>
    </Variant>

    <Variant title="password">
      <FrogTextInput id="6" v-model="modelValue" type="password" />
    </Variant>

    <Variant title="search">
      <FrogTextInput id="7" v-model="modelValue" type="search" @search="initiateSearch" />
    </Variant>

    <Variant title="focus out test">
      <FrogTextInput id="8" v-model="modelValue" @focusout="focusOut" />
    </Variant>
  </Story>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import FrogTextInput from '../FrogTextInput.vue'

const modelValue = ref('')
const placeholder = 'Placeholder Value'

watch(modelValue, (newModelValue) => {
  console.log(newModelValue)
})

const initiateSearch = () => {
  console.log(`Searching for ${modelValue.value}...`)
}

const focusOut = () => {
  console.log('Lost focus, everything is blurry...')
}
</script>
