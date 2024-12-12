<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
    <Story>
        <Variant title="default">
            <FrogToggleSwitch id="default" :modelValue="false" />
        </Variant>
        <Variant title="left label">
            <FrogToggleSwitch id="left-label" :modelValue="false" leftLabel="Left Label" />
        </Variant>
        <Variant title="right label">
            <FrogToggleSwitch id="right-label" :modelValue="false" rightLabel="Right Label" />
        </Variant>
        <Variant title="label both sides">
            <FrogToggleSwitch id="right-label" :modelValue="false" leftLabel="Left Label" rightLabel="Right Label" />
        </Variant>
        <Variant title="disabled">
            <FrogToggleSwitch id="disabled" :modelValue="false" disabled />
        </Variant>
        <Variant title="disabled checked">
            <FrogToggleSwitch id="disabled-checked" modelValue disabled />
        </Variant>
    </Story>
</template>

<script setup lang="ts">
import ToggleSwitch from '../FrogToggleSwitch.vue'
</script>
