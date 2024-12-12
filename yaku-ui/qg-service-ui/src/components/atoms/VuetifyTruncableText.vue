<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div ref="containerRef">
    <span v-if="prefix" ref="prefixRef" class="prefix">{{ prefix.replace(' ', '&nbsp;') }}</span>
    <span ref="fullTextRef" class="fulltext">{{ label }}</span>
    <span class="suffix">{{ suffix }}</span>
  </div>
</template>

<script setup lang="ts">
import { useResizeObserver } from '@vueuse/core'
import { computed, onMounted, ref } from 'vue'

/**
 * Warning: this component is not screen-reader compatible.
 */
const props = defineProps<{
  label: string
  truncateAt: number
}>()

const emit = defineEmits<(e: 'isTruncated', v: boolean) => void>()

const prefix = computed(() =>
  props.truncateAt > 0 ? props.label.substring(0, props.truncateAt) : '',
)
const suffix = computed(() => props.label.substring(props.truncateAt))

const containerRef = ref<HTMLElement>()
const prefixRef = ref<HTMLSpanElement>()
const fullTextRef = ref<HTMLSpanElement>()
const updateOverflowing = () => {
  const prefixEl = prefixRef.value
  const fullText = fullTextRef.value
  if (!prefixEl) return
  const isElTruncated = prefixEl.clientWidth < prefixEl.scrollWidth
  const isFullTextTruncated =
    !!fullText && fullText.clientWidth < fullText.scrollWidth
  emit('isTruncated', isElTruncated || isFullTextTruncated)
}
onMounted(updateOverflowing)
useResizeObserver(containerRef, updateOverflowing)
</script>

<style scoped lang="scss">
div {
  display: flex;
  position: relative;
  container-name: truncable;
  container-type: inline-size;
}

.prefix,
.fulltext {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.prefix {
  display: block; // check overflow easily with css
}

.fulltext {
  display: none;
}

.suffix {
  flex-shrink: 0;
  flex-grow: 0;
  margin-left: 0px;
}

/**
* Meant for fileItem.vue only.
* It display the label prop with a normal ellipsis
* if the size gets too small to display 2 characters and the ellipsis in the prefix
*/
@container truncable (max-width: 14ch) {
  .fulltext {
    display: block;
  }

  .prefix,
  .suffix {
    display: none !important;
  }
}
</style>
