<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div ref="containerRef" class="container" :class="{ truncated: showMore }">
    <slot />
  </div>
  <button v-if="overflowingContent" class="show-more-less" @click.stop="() => showMore = !showMore">
    {{ showMore ? 'Show more' : 'Show less' }}
  </button>
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import { ref, watchEffect } from 'vue'

const containerRef = ref<HTMLDivElement>()
const overflowingContent = ref(false)
const showMore = ref(true)
let offsetHeight: number

const setOverflowingContent = () => {
  if (!containerRef.value) return

  overflowingContent.value = offsetHeight < containerRef.value.scrollHeight
}

watchEffect(() => {
  if (!containerRef.value) return

  offsetHeight = containerRef.value.offsetHeight
  setOverflowingContent()
})

const debouncedFn = useDebounceFn(setOverflowingContent, 250)
window.addEventListener('resize', debouncedFn)
</script>

<style scoped lang="scss">
.container {
  word-break: break-all;  // for links
}

.truncated {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  /* number of lines to show */
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

button.show-more-less {
  font-size: 0.75rem;
  padding: 0;
  border: 0;
  width: fit-content;
  cursor: pointer;

  background-color: inherit;
  color: var(--minor-accent__enabled__front__default); // FIXME

  &:hover {
    color: var(--minor-accent__enabled__front__hovered); // FIXME
  }
}
</style>
