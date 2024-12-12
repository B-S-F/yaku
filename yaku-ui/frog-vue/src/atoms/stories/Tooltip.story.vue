<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
    <Story>
        <Variant title="default (neutral)">
            <Tooltip
            label="default"
            />
        </Variant>
        <Variant title="success">
            <Tooltip title="success"
            label="Success tooltip"
            type="success"
            />
        </Variant>
        <Variant title="error">
            <Tooltip title="error"
            label="Error tooltip"
            type="error"
            />
        </Variant>
        <Variant title="warning">
            <Tooltip title="warning"
            label="Warning tooltip"
            type="warning"
            />
        </Variant>
        <Variant title="dynamic width">
            <Tooltip title="dynamic width"
            label="Dynamic width tooltip"
            width="dynamic"
            />
        </Variant>
    </Story>
</template>

<script setup lang="ts">
import Tooltip from '../Tooltip.vue'
</script>
