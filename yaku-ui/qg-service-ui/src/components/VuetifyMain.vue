<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div id="vuetify-view-layout"
    :class="{ 'bg-grey': route.name !== ROUTE_NAMES.EXCEL_TO_CONFIG && !route.meta.isErrorView }">
    <router-view />
  </div>

</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { ROUTE_NAMES } from '~/router';

/**
 * At this component level, the server and namespace (also the environment)
 * is defined and usable for the user.
 */
const route = useRoute()
</script>

<style scoped lang="scss"></style>
