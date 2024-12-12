<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<!-- This should also have a disabled variant. To be added when implemented -->

<template>
    <Story>
        <Variant title="default">
            <Textarea id="default" modelValue="" />
        </Variant>
        <Variant title="type password">
            <Textarea id="type-password" v-model="secret" type="password" label="A secret inputarea" />
        </Variant>
        <Variant title="standard text area disabled">
            <Textarea id="disabled" modelValue="" disabled />
        </Variant>
        <Variant title="with label">
            <Textarea id="with-label" label="Label" modelValue="" />
        </Variant>
        <Variant title="with very long label">
            <Textarea id="with-long-label"
                label="Lorem ipsum dolor sit amet consectetur adipisicing elit. Excepturi quo suscipit maxime, ipsam officia saepe nisi veritatis"
                modelValue="" />
        </Variant>
        <Variant title="with placeholder">
            <Textarea id="with-placeholder" modelValue="" placeholder="Type something" />
        </Variant>
        <Variant title="with label and placeholder">
            <Textarea id="with-label-and-placeholder" label="Label" modelValue="" placeholder="Type something" />
        </Variant>
        <Variant title="with dynamic height">
            <Textarea id="with-dynamic-height" modelValue="" dynamicHeight />
        </Variant>
    </Story>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Textarea from '../Textarea.vue'

const secret = ref('')
</script>
