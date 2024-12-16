<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div class="letter-icon text-sm-body-1" :data-letters="profileLetters" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getProfilePictureFromName } from '~/utils'

/** generate an icon with 2 letters depending of the name */
const props = defineProps<{
  name: string
}>()

const profileLetters = computed(() => getProfilePictureFromName(props.name))
</script>

<style scoped lang="scss">
.letter-icon {

  &::before {
    padding: $padding-component-xxs;
    content: attr(data-letters);

    display: grid;
    place-content: center;
    width: 1.875rem;
    height: 1.675rem;

    border: 1px solid rgb(var(--v-border-color));
    border-radius: 4px;

    text-transform: uppercase;
  }
}
</style>
