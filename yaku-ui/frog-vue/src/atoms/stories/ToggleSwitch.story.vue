<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
    <Story>
        <Variant title="default">
            <ToggleSwitch id="default" :modelValue="false" />
        </Variant>
        <Variant title="left label">
            <ToggleSwitch id="left-label" :modelValue="false" leftLabel="Left Label" />
        </Variant>
        <Variant title="right label">
            <ToggleSwitch id="right-label" :modelValue="false" rightLabel="Right Label" />
        </Variant>
        <Variant title="label both sides">
            <ToggleSwitch id="right-label" :modelValue="false" leftLabel="Left Label" rightLabel="Right Label" />
        </Variant>
        <Variant title="disabled">
            <ToggleSwitch id="disabled" :modelValue="false" disabled />
        </Variant>
        <Variant title="disabled checked">
            <ToggleSwitch id="disabled-checked" modelValue disabled />
        </Variant>
    </Story>
</template>

<script setup lang="ts">
import ToggleSwitch from '../ToggleSwitch.vue'
</script>
