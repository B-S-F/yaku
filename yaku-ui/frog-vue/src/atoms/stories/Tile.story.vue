<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
    <Story>
        <Variant title="default">
            <FrokTile>
                <h1>Default tile</h1>
                <p>Default tile content</p>
            </FrokTile>
        </Variant>
        <Variant title="secondary">
            <Tile :secondary="true">
                <h1>Secondary tile</h1>
                <p>Secondary tile content</p>
            </Tile>
        </Variant>
    </Story>
</template>

<script setup lang="ts">
import Tile from '../Tile.vue'
</script>
