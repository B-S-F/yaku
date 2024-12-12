// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { useElementBounding, type MaybeRef } from '@vueuse/core'
import type { ArrowPlacement, Direction, Offset, Placement } from '../types'
import { type Ref, computed, reactive, unref } from 'vue'

const oppositeDirection: Record<Direction, Direction> = {
  top: 'bottom',
  right: 'left',
  bottom: 'top',
  left: 'right',
}

export type PositionOverflow = {
  left: boolean
  top: boolean
  right: boolean
  bottom: boolean
}
export const getFallbackPlacement = (
  placement: ArrowPlacement,
  overflowOn: PositionOverflow,
): ArrowPlacement => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, prefer-const
  let [_, block, inline] = placement.split('-') as [
    '',
    Direction | 'without',
    Placement,
  ]

  // handle the hacky -without-arrow-<top|bottom> cases
  if (block === 'without') {
    if (overflowOn.top) return '-without-arrow-bottom'
    if (overflowOn.bottom) return '-without-arrow-top'
    return placement
  }

  // If the container is too big to be place on left or right,
  // then place it on top or under the anchor
  if (overflowOn.right && overflowOn.left) {
    block = overflowOn.bottom ? 'bottom' : 'top'
    inline = 'center' // take as small space as possible on the x axis
    return `-${block}-${inline}` as ArrowPlacement
  } else if (overflowOn.right || overflowOn.left) {
    block = oppositeDirection[block] // place it on the opposite direction if one overflows
  }

  if (overflowOn.top && overflowOn.bottom) {
    block = overflowOn.right ? 'left' : 'right'
    inline = 'center' // take as small space as possible on the y axis
  } else if (overflowOn.bottom) {
    block = 'bottom' // place it on the opposite direction if one overflows
    inline = 'center' // put it in the center for simplicity
  } else if (overflowOn.top) {
    block = 'top'
    inline = 'center' // put it in the center for simplicity
  }

  return `-${block}-${inline}` as ArrowPlacement
}

const getTargetOffsetForPositionAndArrowClass = (
  position: Omit<DOMRect, 'toJSON'>,
  arrowClass: ArrowPlacement,
): Offset => {
  switch (arrowClass) {
    case '-right-center':
    case '-right-top':
    case '-right-bottom':
      return {
        left: position.left,
        top: position.top + (position.bottom - position.top) / 2,
      }

    case '-left-center':
    case '-left-top':
    case '-left-bottom':
      return {
        left: position.right,
        top: position.top + (position.bottom - position.top) / 2,
      }

    case '-bottom-center':
    case '-bottom-left':
    case '-bottom-right':
    case '-without-arrow-top':
      return {
        left: position.left + (position.right - position.left) / 2,
        top: position.top,
      }

    default:
      return {
        left: position.left + (position.right - position.left) / 2,
        top: position.bottom,
      }
  }
}

const getPositionOffsetForDimensionAndArrowClass = (
  dimension: Omit<DOMRect, 'toJSON'>,
  arrowClass: ArrowPlacement,
): Offset => {
  const left = ((): number => {
    switch (arrowClass) {
      case '-bottom-right':
      case '-top-right':
      case '-right-top':
      case '-right-center':
      case '-right-bottom':
        return dimension.right - dimension.left

      case '-bottom-left':
      case '-top-left':
      case '-left-top':
      case '-left-center':
      case '-left-bottom':
        return 0

      default:
        return (dimension.right - dimension.left) / 2
    }
  })()

  const top = ((): number => {
    switch (arrowClass) {
      case '-left-center':
      case '-right-center':
        return (dimension.bottom - dimension.top) / 2

      case '-left-bottom':
      case '-right-bottom':
      case '-bottom-left':
      case '-bottom-right':
      case '-bottom-center':
      case '-without-arrow-top':
        return dimension.bottom - dimension.top

      default:
        return 0
    }
  })()

  return { top, left }
}

const getStaticOffsetForArrowClass = (
  arrowClass: ArrowPlacement,
): { [K in keyof Offset]: string } => {
  const left = ((): string => {
    switch (arrowClass) {
      case '-right-top':
      case '-right-center':
      case '-right-bottom':
        return '- 1rem'

      case '-left-top':
      case '-left-center':
      case '-left-bottom':
        return '+ 1rem'

      case '-top-right':
      case '-bottom-right':
        return '+ 24px'

      case '-top-left':
      case '-bottom-left':
        return '- 24px'

      default:
        return '+ 0px'
    }
  })()

  const top = ((): string => {
    switch (arrowClass) {
      case '-right-top':
      case '-left-top':
        return '- 24px'

      case '-right-center':
      case '-left-center':
        return '+ 0px'

      case '-right-bottom':
      case '-left-bottom':
        return '+ 24px'

      case '-bottom-right':
      case '-bottom-center':
      case '-bottom-left':
        return '- 1rem'

      case '-without-arrow-bottom':
        return '+ 12px'

      case '-without-arrow-top':
        return '- 12px'

      default:
        return '+ 1rem'
    }
  })()

  return { left, top }
}

type UsePopoverPositionParams = {
  container: Ref<HTMLElement | undefined>
  target: Ref<HTMLElement | undefined>
  arrowPlacement: MaybeRef<ArrowPlacement>
}
export const usePopoverPosition = (params: UsePopoverPositionParams) => {
  const { container, target, arrowPlacement } = params

  const containerDimensions = useElementBounding(container)

  const targetDimensions = useElementBounding(target)

  const position = computed(() =>
    target.value
      ? getTargetOffsetForPositionAndArrowClass(
          reactive(containerDimensions),
          unref(arrowPlacement),
        )
      : undefined,
  )

  /** Returns the expected left and top offset of the popover content */
  const targetOffset = computed(() =>
    target.value
      ? getPositionOffsetForDimensionAndArrowClass(
          reactive(targetDimensions),
          unref(arrowPlacement),
        )
      : undefined,
  )

  const arrowOffset = computed(() =>
    getStaticOffsetForArrowClass(unref(arrowPlacement)),
  )

  const topStyle = computed(() =>
    position.value && targetOffset.value
      ? `calc(${Math.ceil(position.value.top - targetOffset.value.top)}px ${arrowOffset.value.top})`
      : '0px',
  )
  const leftStyle = computed(() =>
    position.value && targetOffset.value
      ? `calc(${Math.ceil(position.value.left - targetOffset.value.left)}px ${arrowOffset.value.left})`
      : '0px',
  )

  return {
    topStyle,
    leftStyle,
  }
}
