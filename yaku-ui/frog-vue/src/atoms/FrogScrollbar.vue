<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div :class="`btn-scroll-group ${axis}`">
    <FrogButton v-show="showFirstBtn" integrated :icon="axis === 'y' ? 'mdi-chevron-double-up' : 'mdi-chevron-double-left'"
      @click="emit('first-btn-click')" />
    <div ref="scrollbarRef" class="scrollbar" @mousemove="onMove">
      <div ref="thumbRef" class="thumb" @mousedown="onGrab" />
    </div>
    <FrogButton v-show="showLastBtn" integrated :icon="axis === 'y' ? 'mdi-chevron-double-down' : 'mdi-chevron-double-right'"
      @click="emit('last-btn-click')" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import FrogButton from './FrogButton.vue'

/**
 * Scrollbar is the whole container
 * Thumb is the dragging part
 */
const props = withDefaults(
  defineProps<{
    progress: number
    axis: 'x' | 'y'
    size?: number
  }>(),
  {
    size: 0.1,
  },
)

const emit = defineEmits<{
  (e: 'scroll', movement: number): void
  (e: 'first-btn-click'): void
  (e: 'last-btn-click'): void
}>()

// -----------
//  Scrollbar
// -----------
const scrollbarRef = ref<HTMLDivElement>()
const thumbRef = ref<HTMLDivElement>()
const thumbSize = computed(() => `${props.size * 100}%`)
const progressStyle = computed(() => `${(props.progress * 100).toFixed(2)}%`) // for css

const grabbing = ref(false)
const canMove = ref(true) // avoid to much triggers
const onGrab = () => {
  grabbing.value = true
  document.body.style['userSelect'] = 'auto'
  document.body.style['webkitUserSelect'] = 'none' // still needed on safari
  document.addEventListener('mouseup', onDrop)
  document.addEventListener('mousemove', onMove)
}
const onDrop = () => {
  grabbing.value = false
  document.body.style['userSelect'] = 'auto'
  document.body.style['webkitUserSelect'] = 'auto' // still needed on safari
  document.removeEventListener('mouseup', onDrop)
  document.removeEventListener('mousemove', onMove)
}
const onMove = (e: MouseEvent) => {
  if (!grabbing.value || !canMove.value) return

  // get DOM measures useful for calculation
  const scrollbarBoundingClient = (
    scrollbarRef.value as HTMLDivElement
  ).getBoundingClientRect()
  const thumbBoundingRect = (
    thumbRef.value as HTMLDivElement
  ).getBoundingClientRect()

  // normalize data retrieved for calculation on one axis: x or y
  const { pos, size } =
    props.axis === 'y'
      ? ({ pos: 'y', size: 'height' } as const)
      : ({ pos: 'x', size: 'width' } as const)
  const coords = {
    eventPos: e[pos],
    scrollbarPos: scrollbarBoundingClient[pos],
    scrollbarSize: scrollbarBoundingClient[size],
    thumbSize: thumbBoundingRect[size],
  }

  const newPos = coords.eventPos - coords.scrollbarPos + coords.thumbSize / 2
  const progress = Math.max(0, Math.min(newPos / coords.scrollbarSize, 1))

  emit('scroll', progress)

  canMove.value = false
  setTimeout(() => (canMove.value = true), 16)
}

// ---------
//  Buttons
// ---------
const BTN_SIZE = 24 // .a-icon fixed font-size

const btnRelativeSize = computed(() => {
  const scrollbarSize =
    scrollbarRef.value?.getBoundingClientRect()[
      props.axis === 'y' ? 'height' : 'width'
    ] ?? 1
  return BTN_SIZE / scrollbarSize
})

const showFirstBtn = computed(() => {
  if (!thumbRef.value) return false // and trigger reactivity
  return props.progress > btnRelativeSize.value
})
const showLastBtn = computed(() => {
  if (!thumbRef.value) return false // and trigger reactivity
  return props.progress < 1 - props.size - btnRelativeSize.value
})
</script>

<style lang="scss" scoped>
$buttonSize: 24px;

$scrollbarThickness: 0.375rem;

.scrollbar {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: $buttonSize; // y-scrollbar
  display: flex;
  justify-content: center;
  align-items: center;

  .thumb {
    --bg: #616161; // vuetify grey-darken-2
    background-color: var(--bg);
    cursor: pointer;
    position: absolute;

    &:hover {
      --bg: #424242; // vuetify grey-darken-3
    }

    &:active {
      --bg: #212121; // vuetify grey-darken-4
      cursor: grabbing;
    }
  }
}

.btn-scroll-group {
  display: flex;
  justify-content: space-between;
  background-color: var(--background);

  &>*:not(.scrollbar) {
    position: absolute;
    z-index: 2;
  }

  &.x {
    position: sticky;
    bottom: 0.35rem;

    .thumb {
      left: v-bind(progressStyle);
      width: v-bind(thumbSize);
      height: $scrollbarThickness;
    }

    &>*:nth-child(3) {
      left: calc(100% - $buttonSize);
    }
  }

  &.y {
    flex-direction: column;
    position: absolute;
    top: 0;
    right: 0;
    height: calc(100% - 1rem); // let bottom place for the .btn-scroll-x
    width: $buttonSize;

    .thumb {
      top: v-bind(progressStyle);
      width: $scrollbarThickness;
      height: v-bind(thumbSize);
    }

    &>*:nth-child(3) {
      bottom: 0;
    }
  }

  &> :deep(button.v-btn) {
    height: 24px !important;
    width: 24px !important;
  }
}
</style>
