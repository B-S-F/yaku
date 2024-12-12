<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div class="banner-content">
    <slot>
      <span>{{ label }}</span>
    </slot>
    <FrogButton v-if="!isToast" integrated icon="mdi-close" @click="emit('close')" />
  </div>
</template>

<script lang="ts" setup>
import FrogButton from '@B-S-F/frog-vue/src/atoms/FrogButton.vue'
import { onMounted } from 'vue'

const props = withDefaults(
  defineProps<{
    label?: string
    isToast?: boolean
  }>(),
  {
    isToast: true,
  },
)

const emit = defineEmits<(e: 'close') => void>()

onMounted(() => {
  if (props.isToast) {
    setTimeout(() => {
      emit('close')
    }, 3000)
  }
})
</script>

<style scoped lang="scss">
@use '../../styles/mixins/flex.scss' as Flex;

.banner-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

:global(.a-notification:has(.banner-content)) {
  @include Flex.flexbox;
}
</style>
