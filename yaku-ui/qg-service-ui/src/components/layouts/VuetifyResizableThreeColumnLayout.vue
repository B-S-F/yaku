<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <component :is="tag" class="resizable-three-col-layout"
    :class="{ 'resizing': isResizingLeftPanel || isResizingRightPanel }" :style="{
      '--left-panel-width': leftPanelDefaultWidth,
      '--right-panel-width': rightPanelWidth,
    }">
    <div ref="leftPanelRef" class="left-panel">
      <slot name="left-panel" />
      <FrogButton class="resize-btn-right" icon="mdi-arrow-split-vertical" integrated arial-label="resize panel"
        @mousedown="resizeLeftPanel" />
    </div>
    <div ref="middlePanelRef" class="middle-panel">
      <slot name="middle-panel" />
    </div>
    <div ref="rightPanelRef" class="right-panel">
      <slot name="right-panel" />
      <FrogButton class="resize-btn-left" icon="mdi-arrow-split-vertical" integrated arial-label="resize panel"
        @mousedown="resizeRightPanel" />
    </div>

    <Teleport to="#app">
      <slot name="teleport" />
    </Teleport>
  </component>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useResizeDnD } from '~/composables'

const props = withDefaults(
  defineProps<{
    tag: string
    leftPanelMin?: number
    leftPanelMax?: number
    rightPanelMin?: number
    rightPanelMax?: number
  }>(),
  {
    leftPanelMin: 250,
    rightPanelMin: 500,
    leftPanelMax: 400,
    rightPanelMax: 800,
  },
)

const middlePanelRef = ref<HTMLDivElement>()
const leftPanelRef = ref<HTMLDivElement>()
const rightPanelRef = ref<HTMLDivElement>()
const leftPanelDefaultWidth = ref<string>(`${props.leftPanelMax}px`)
const rightPanelWidth = ref<string>(`${props.rightPanelMin}px`)

const onLeftPanelResize = ({ clientX }: MouseEvent) => {
  if (!leftPanelRef.value) return
  const originX = leftPanelRef.value.getBoundingClientRect().x
  leftPanelDefaultWidth.value = `${Math.max(props.leftPanelMin, Math.min(clientX - originX, props.leftPanelMax))}px`
}

const onRightPanelResize = ({ clientX }: MouseEvent) => {
  if (!rightPanelRef.value) return
  const originX = rightPanelRef.value.getBoundingClientRect().right
  rightPanelWidth.value = `${Math.max(props.rightPanelMin, Math.min(originX - clientX, props.rightPanelMax))}px`
}
const { setResize: resizeLeftPanel, isResizing: isResizingLeftPanel } =
  useResizeDnD({
    onResize: onLeftPanelResize,
  })

const { setResize: resizeRightPanel, isResizing: isResizingRightPanel } =
  useResizeDnD({
    onResize: onRightPanelResize,
  })
</script>

<style scoped lang="scss">
@use '../../styles/tokens.scss' as *;
@use '../../styles/mixins/resize-btn.scss' as *;

.resizable-three-col-layout {
  display: grid;
  grid-template-columns: var(--left-panel-width, auto) minmax(0, 1fr) var(--right-panel-width, auto);
  grid-template-rows: minmax(0, 1fr) auto;
  gap: $spacing-32 $spacing-32;

  --middle-panel: var(--middle-panel-width, 0);

  &.resizing * {
    user-select: none;
    -webkit-user-select: none; // safari
  }

  .resize-btn-left {
    $width: 0.9rem;
    $height: 5.4rem;
    padding-top: 5rem;
    padding-bottom: 5rem;
    position: absolute;
    left: 0;
    top: calc(50% - #{$height * 0.5});
    width: $width;
    height: $height;
    cursor: ew-resize;
    background: #E0E0E0; // grey-lighten-2
    border: none;
    border-radius: 4px;
    font-size: xx-small;
    --handle-color: #0D47A1; // blue-darken-4

    &:hover {
      --handle-color: #000000;
    }

    &:active {
      --handle-color: #000000;
    }

    &::before,
    &::after {
      $handleHeight: 0.5rem;
      display: block;
      position: absolute;
      width: 1px;
      height: $handleHeight;
      background-color: var(--handle-color);
      transform: translate(calc($width * 0.5 + var(--from-x-center)), #{($height - $handleHeight) * 0.5})
    }

    &::before {
      --from-x-center: -2px;
    }

    &::after {
      --from-x-center: 0px;
    }
  }

  .resize-btn-right {
    $width: 0.9rem;
    $height: 5.4rem;
    padding-top: 5rem;
    padding-bottom: 5rem;
    position: absolute;
    right: 0;
    top: calc(50% - #{$height * 0.5});
    width: $width;
    height: $height;
    cursor: ew-resize;
    background: #E0E0E0; // grey-lighten-2
    border: none;
    border-radius: 4px;
    font-size: xx-small;
    --handle-color: #0D47A1; // blue-darken-4

    &:hover {
      --handle-color: #000000;
    }

    &:active {
      --handle-color: #000000;
    }

    &::before,
    &::after {
      $handleHeight: 0.5rem;
      display: block;
      position: absolute;
      width: 1px;
      height: $handleHeight;
      background-color: var(--handle-color);
      transform: translate(calc($width * 0.5 + var(--from-x-center)), #{($height - $handleHeight) * 0.5})
    }

    &::before {
      --from-x-center: -2px;
    }

    &::after {
      --from-x-center: 0px;
    }
  }
}

.left-panel {
  grid-area: 1 / 1 / -1 / 2;
  position: relative;
  border-right: 0.0625rem solid #BDBDBD; // grey-lighten-1

  :deep(.resize-btn) {
    right: 0;
  }
}

.middle-panel,
.error {
  grid-area: 1 / 2 / -1 / 3;
  // TODO maybe move this into the CodeEditor
  display: flex;
  flex-flow: column;
}

.right-panel {
  grid-area: 1 / 3 / -1 / 4;
  position: relative;
  border-left: 0.0625rem solid #BDBDBD; // grey-lighten-1


  :deep(.resize-btn) {
    left: 0;
  }
}
</style>
