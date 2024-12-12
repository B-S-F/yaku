<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
<div class="box-modal -show">
    <slot />
</div>
</template>

<script setup lang="ts">
</script>

<style scoped lang="scss">
.box-modal {
    align-items: center;
    backdrop-filter: blur(.25rem);
    background-color: rgba(113, 118, 124, .25);
    height: 100vh;
    justify-content: center;
    left: 0;
    position: fixed;
    top: 0;
    width: 100vw;
}
.box-modal.-show {
    display: flex;
}
</style>
