<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<!-- eslint-disable vue/no-v-html -->
<template>
  <VuetifyMarkdown ref="descriptionRef" tag="div" class="description" :class="descClass" :source="content" />
  <VuetifyExpandTextToggle v-if="isDescOverflow" v-model="isDescriptionOpen" class="expand-toggle" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  description: string
  displayFull?: boolean
}>()

const content = computed(() => props.description)

// --------------------
//  Toggle the content
// --------------------
const descriptionRef = ref<HTMLDivElement>()

const isDescriptionOpen = ref(false)
const isDescOverflow = ref<boolean | null>(null)

const SHRINK_CLASS = 'close'
const descClass = computed(() => ({
  [SHRINK_CLASS]: !isDescriptionOpen.value,
}))

watch(descriptionRef, (node) => {
  if (!node) return
  const hasClose = node.classList?.contains(SHRINK_CLASS)
  node.classList?.remove(SHRINK_CLASS)
  const { clientHeight: fullHeight } = node
  node.classList?.add(SHRINK_CLASS)
  const { clientHeight: shrinkedHeight } = node
  isDescOverflow.value = fullHeight > shrinkedHeight
  if (!hasClose) node.classList?.remove(SHRINK_CLASS)
})
</script>

<style scoped lang="scss">
.description {

  // markdown styles
  & :deep(*) {
    @import '../../styles/components/run-report-md-format';

    &:first-child {
      margin-top: 0;
    }

    &:last-child {
      margin-bottom: 0;
    }
  }
}

// SHRINK_CLASS
.close {
  :deep(p) {
    display: -webkit-box;
    overflow: hidden;
    text-overflow: ellipsis;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
  }
}

.expand-toggle :deep(.v-btn__content) {
  padding: 0;
}
</style>
