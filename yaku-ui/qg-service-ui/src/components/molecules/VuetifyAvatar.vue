<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <v-avatar class="mo-avatar" :class="{ [colorScheme.bg]: !props.bg }" rounded="circle">
    <v-img v-if="src" :src="src" :alt="name" />
    <span v-else>{{ initials }}</span>
  </v-avatar>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { avatarColors } from '~/constants/colors'
import getAvatarColors from '~/helpers/getAvatarColor'

export type AvatarProps = {
  name: string
  color?: string
  bg?: string
  src?: string
}
const props = defineProps<AvatarProps>()
const initials = computed(() => {
  const [first, last] = props.name.split(' ')
  if (first && last) return first.charAt(0) + last.charAt(0)
  return props.name.charAt(0) + props.name.charAt(1)
})
const colorScheme = computed(
  () =>
    avatarColors[
      getAvatarColors(props.name.toLowerCase(), Object.keys(avatarColors))
    ],
)
const color = computed(() => props.color)
const bg = computed(() => props.bg)
</script>
<style scoped lang="scss">
@use '../../styles/helpers.scss' as *;

.mo-avatar {
  /** reset */
  margin: 0;
  width: $spacing-32r;
  height: $spacing-32r;
  background-color: v-bind('bg ? bg : null');

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  span {
    font-size: rem(12px);
    font-weight: 600;
    text-transform: uppercase;
    color: v-bind('color ? color : null');
  }
}
</style>
