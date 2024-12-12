<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
    <Story>
        <Variant title="default">
            <FrogTextarea id="default" modelValue="" />
        </Variant>
        <Variant title="v-model compatibility">
            <FrogTextarea id="v-model-compatibility" v-model="myval" label="An input area whose model is bound to an external variable" />
            Eingabe: {{ myval }}
        </Variant>
        <Variant title="standard text area disabled">
            <FrogTextarea id="disabled" modelValue="" disabled />
        </Variant>
        <Variant title="with label">
            <FrogTextarea id="with-label" label="Label" modelValue="" />
        </Variant>
        <Variant title="with very long label">
            <FrogTextarea id="with-long-label"
                label="Lorem ipsum dolor sit amet consectetur adipisicing elit. Excepturi quo suscipit maxime, ipsam officia saepe nisi veritatis"
                modelValue="" />
        </Variant>
        <Variant title="with placeholder">
            <FrogTextarea id="with-placeholder" modelValue="" placeholder="Type something" />
        </Variant>
        <Variant title="with label and placeholder">
            <FrogTextarea id="with-label-and-placeholder" label="Label" modelValue="" placeholder="Type something" />
        </Variant>
        <Variant title="with dynamic height">
            <FrogTextarea id="with-dynamic-height" modelValue="" dynamicHeight/>
        </Variant>
    </Story>
</template>

<script setup lang="ts">
import FrogTextarea from '../FrogTextarea.vue'
import { ref } from 'vue'

const myval = ref('Meine Eingabe')
</script>
