<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
    <Story>
        <Variant title="default">
            <FrogCheckbox
                id="click-me"
                name="default"
                label="Check Me"
            />
        </Variant>
        <Variant title="disabled">
            <FrogCheckbox
                id="click-me"
                name="disabled"
                disabled
                label="Check Me"
            />
        </Variant>
        <Variant title="checked">
            <FrogCheckbox
                id="click-me"
                name="checked"
                modelValue
                label="Check Me"
            />
        </Variant>
        <Variant title="checked disabled">
            <FrogCheckbox
                id="click-me"
                name="checked disabled"
                disabled
                modelValue
                label="Check Me"
            />
        </Variant>
        <Variant title="indeterminate">
            <FrogCheckbox
                id="click-me"
                name="indeterminate"
                indeterminate
                label="Click Me"
            />
        </Variant>
        <Variant title="indeterminate disabled">
            <FrogCheckbox
                id="click-me"
                name="indeterminate disabled"
                disabled
                indeterminate
                label="Check Me"
            />
        </Variant>
    </Story>
</template>

<script setup lang="ts">
import FrogCheckbox from '../FrogCheckbox.vue'
</script>
