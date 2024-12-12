<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div class="handle-wrapper">
    <div class="handle" />
    <span v-if="label" :class="labelPos">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label?: string
  labelPos?: 'top' | 'bottom'
}>()

const labelAlignmentDirection = computed(() =>
  props.labelPos === 'top' ? 1 : -1,
)
</script>

<style scoped lang="scss">
.handle-wrapper {
  width: $handleWidth; // easier positioning in the parent component
}

.handle {
  position: absolute;
  width: $rectangleWidth;
  height: $handleHeight;
  background-color: #2196F3; // blue
  overflow: visible;
  cursor: pointer;
  z-index: 2;

  // triangle in CSS with clip-path
  &::before {
    position: relative;
    display: block;
    content: "";
    left: 100%;
    width: $triangleWidth;
    height: $handleHeight;
    background-color: inherit;
    clip-path: polygon(0 0, 0% 100%, 100% 50%);
  }
}

span {
  position: absolute; // do not take space in the container
  top: calc((#{$handleHeight} + #{12px}) * v-bind(labelAlignmentDirection));
  right: calc(100% - $rectangleWidth);
  z-index: 3;

  &.bottom {
    transform: translateY(-50%);
  }
}
</style>
