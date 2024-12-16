<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div ref="reference" @mouseenter="onMouseEnter" @focus="onFocus" @mouseleave="hideDebounced" @blue="onBlur">
    <slot />
    <Teleport v-if="isMounted && !deactivate" to="#app" :disabled="!attached">
      <v-card v-if="localShow && (slots.content || label)" ref="floating" class="frog-menu" :class="[localArrowPlacement,
        { 'tooltip-alike': tooltipAlike },
        { '-without-arrow': arrowPlacementClass.includes('-without-arrow') },
      ]" :style="floatingStyles">
        <v-toolbar v-if="closeable" density="comfortable" color="transparent">
          <v-spacer />
          <v-toolbar-items>
            <v-btn icon="mdi-close" @click="emit('close')" />
          </v-toolbar-items>
        </v-toolbar>
        <v-card-title v-if="slots.headline">
          <slot name="headline" />
        </v-card-title>
        <v-card-text>
          <slot name="content">
            <span>{{ label }}</span>
          </slot>
        </v-card-text>
        <v-card-actions v-if="actionLabel">
          <FrogButton @click="emit('action')">
            {{ actionLabel }}
          </FrogButton>
        </v-card-actions>
      </v-card>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, useSlots, type CSSProperties, computed } from 'vue'
import {
  autoUpdate,
  flip,
  offset,
  useFloating,
  type Placement,
} from '@floating-ui/vue'
import type { ArrowPlacement } from '../types'
import FrogButton from '../atoms/FrogButton.vue'
import { useElementBounding, useMounted, useThrottleFn } from '@vueuse/core'

type PopoverProps = {
  label?: string
  deactivate?: boolean
  show?: boolean
  triggerOnHover?: boolean
  attached?: boolean
  pophoverClass?: string
  popoverStyles?: CSSProperties
  closeable?: boolean
  actionLabel?: string
  /** suggestion of placement. It will fallback to another position if some content overflows. */
  arrowPlacementClass?: ArrowPlacement
  tooltipAlike?: boolean
  autoPlace?: boolean
  maxWidth?: string
}
const props = withDefaults(defineProps<PopoverProps>(), {
  arrowPlacementClass: '-top-center',
  autoPlace: true,
  maxWidth: '24rem',
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'action'): void
}>()
const slots = useSlots()
const floating = ref<HTMLElement>()
const reference = ref<HTMLElement>()

const isMounted = useMounted()

const localArrowPlacement = ref(props.arrowPlacementClass)
watch(
  () => props.arrowPlacementClass,
  (newVal) => {
    localArrowPlacement.value = newVal
  },
)

const localShow = ref(!!props.show)
watch(
  () => props.show,
  (newVal) => {
    localShow.value = !!newVal
  },
)

const toggleShow = (val: boolean) => {
  if (props.triggerOnHover) {
    localShow.value = val
  }
}
/** use a debounce for Chrome with text ellipsis content to smoothen the hidding */
const hideDebounced = useThrottleFn(() => toggleShow(false), 8)

const onFocus = () => toggleShow(true)
const onMouseEnter = () => {
  if (!localShow.value) toggleShow(true)
}
const onBlur = () => toggleShow(true)

const originalPos = computed<Placement>(() => {
  switch (props.arrowPlacementClass) {
    case '-top-left':
      return 'bottom-start'
    case '-top-center':
      return 'bottom'
    case '-top-right':
      return 'bottom-end'
    case '-bottom-left':
      return 'top-start'
    case '-bottom-center':
      return 'top'
    case '-bottom-right':
      return 'top-end'
    case '-left-top':
      return 'right-start'
    case '-left-bottom':
      return 'right-end'
    case '-left-center':
      return 'right'
    case '-right-bottom':
      return 'left-end'
    case '-right-top':
      return 'left-start'
    case '-right-center':
      return 'left'
    case '-without-arrow-bottom':
      return 'bottom'
    case '-without-arrow-top':
      return 'top'
    default:
      return props.arrowPlacementClass
  }
})

const remValue = computed(() =>
  reference.value
    ? Number.parseFloat(getComputedStyle(reference.value).fontSize)
    : 16,
)
const { width, height } = useElementBounding(reference)
const arrowWidthWithTransform =
  Math.abs(22 * Math.cos(45)) + Math.abs(22 * Math.sin(45)) // the arrow has a fixed width/height of 22px
const arrowOffsetX = computed(() =>
  width.value && width.value > 0
    ? `${width.value / 2 - arrowWidthWithTransform / 2}px`
    : '1rem',
)
const arrowOffsetY = computed(() =>
  height.value && height.value > 0
    ? `${height.value / 2 - arrowWidthWithTransform / 2}px`
    : '1rem',
)
const calcPosition = (
  placement: Placement,
): { crossAxis: number; mainAxis: number } => {
  switch (placement) {
    case 'bottom-start':
    case 'top-start':
      return {
        crossAxis: 0,
        mainAxis: remValue.value,
      }
    case 'bottom-end':
      return {
        crossAxis: 0,
        mainAxis: remValue.value,
      }
    case 'top-end':
      return {
        crossAxis: 0,
        mainAxis: remValue.value,
      }
    case 'right-start':
      return {
        crossAxis: 0,
        mainAxis: remValue.value,
      }
    case 'right-end':
      return {
        crossAxis: 0,
        mainAxis: remValue.value,
      }
    case 'left-start':
      return {
        crossAxis: 0,
        mainAxis: remValue.value,
      }
    case 'left-end':
      return {
        crossAxis: 0,
        mainAxis: remValue.value,
      }
    default:
      return {
        crossAxis: 0,
        mainAxis: remValue.value,
      }
  }
}

const { floatingStyles, placement } = useFloating(reference, floating, {
  placement: originalPos.value,
  whileElementsMounted: autoUpdate,
  middleware: [
    offset(() => calcPosition(originalPos.value)),
    flip({ fallbackAxisSideDirection: 'start' }),
  ],
})

const mapFloatingToFrokPlacement = (placement: Placement): ArrowPlacement => {
  switch (placement) {
    case 'bottom-start':
      return '-top-left'
    case 'bottom':
      return '-top-center'
    case 'bottom-end':
      return '-top-right'
    case 'top-start':
      return '-bottom-left'
    case 'top':
      return '-bottom-center'
    case 'top-end':
      return '-bottom-right'
    case 'right-start':
      return '-left-top'
    case 'right-end':
      return '-left-bottom'
    case 'right':
      return '-left-center'
    case 'left-end':
      return '-right-bottom'
    case 'left-start':
      return '-right-top'
    case 'left':
      return '-right-center'
    default:
      return '-without-arrow-bottom'
  }
}
watch(placement, (newPlacement) => {
  localArrowPlacement.value = mapFloatingToFrokPlacement(newPlacement)
})
</script>

<style scoped lang="scss">
@use "sass:math";

.frog-menu.-top-left:after,
.frog-menu.-top-left:before {
  left: v-bind(arrowOffsetX);
}

.frog-menu.-bottom-center:after,
.frog-menu.-bottom-center:before {
  bottom: -11px;
  left: calc(50% - 11px);
  right: 0;
  top: auto;
  transform: rotate(45deg);
  transform-origin: center;
}

.frog-menu.-bottom-left:after,
.frog-menu.-bottom-left:before {
  left: v-bind(arrowOffsetX);
  right: 0;
  top: auto;
  transform: rotate(-45deg);
  transform-origin: top left;
}

.frog-menu.-left-top:after,
.frog-menu.-left-top:before {
  top: v-bind(arrowOffsetY);
  bottom: 0;
  left: -22px;
  right: 0;
  transform: rotate(-45deg);
  transform-origin: top right;
}

.frog-menu.-left-bottom:after,
.frog-menu.-left-bottom:before {
  bottom: v-bind(arrowOffsetY);
  left: -22px;
  right: 0;
  top: 1rem;
  transform: rotate(-45deg);
  transform-origin: top right;
}

.frog-menu.-top-right:after,
.frog-menu.-top-right:before {
  bottom: 0;
  left: auto;
  right: 1rem;
  top: -22px;
  transform: rotate(-45deg);
  transform-origin: bottom right;
}

.frog-menu.-bottom-right:after,
.frog-menu.-bottom-right:before {
  bottom: -22px;
  left: auto;
  right: 1rem;
  top: auto;
  transform: rotate(45deg);
  transform-origin: top right;
}

.frog-menu.-right-top:after,
.frog-menu.-right-top:before {
  top: v-bind(arrowOffsetY);
  bottom: auto;
  left: auto;
  right: -22px;
  transform: rotate(45deg);
  transform-origin: top left;
}

.frog-menu.-right-center:after,
.frog-menu.-right-center:before {
  top: calc(50% - 15px);
  bottom: 0;
  left: auto;
  right: -22px;
  transform: rotate(45deg);
  transform-origin: top left;
}

.frog-menu.-left-center:after,
.frog-menu.-left-center:before {
  bottom: 0;
  left: -11px;
  right: 0;
  top: calc(50% - 15px);
  transform: rotate(45deg);
  transform-origin: center;
}

.frog-menu.-right-bottom:after,
.frog-menu.-right-bottom:before {
  bottom: v-bind(arrowOffsetY);
  left: auto;
  right: -22px;
  top: 1rem;
  transform: rotate(45deg);
  transform-origin: top left;
}

.frog-menu.-without-arrow:after {
  display: none;
}

@function rem($px, $base: 16px) {
  @return math.div($px, $base) * 1rem;
}

.frog-menu {
  overflow: visible;
  max-width: v-bind(maxWidth);
  // NOTE: vuetify dialogs are raised by 2400 z-index, this allows popovers to show on dialogs
  z-index: 2401;
}

.frog-menu.tooltip-alike {
  .v-card-text {
    padding: .25rem .75rem;
  }
}

.frog-menu:after {
  height: 22px;
  width: 22px;
  content: "";
  position: absolute;
  display: block;
  z-index: -1;
  background-color: #fff;
  top: -11px;
  box-shadow: none;
  bottom: auto;
  left: calc(50% - 11px);
  transform: rotate(45deg);
  transform-origin: center;
}
</style>
