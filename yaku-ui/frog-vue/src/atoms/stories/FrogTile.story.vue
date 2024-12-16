<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
    <Story>
        <Variant title="default">
            <FrogTile>
                <h1>Default tile</h1>
                <p>Default tile content</p>
            </FrogTile>
        </Variant>
        <Variant title="secondary">
            <FrogTile :secondary="true">
                <h1>Secondary tile</h1>
                <p>Secondary tile content</p>
            </FrogTile>
        </Variant>
    </Story>
</template>

<script setup lang="ts">
import FrogTile from '../FrogTile.vue'
</script>
