// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { onMounted, reactive, ref, Ref, watchEffect } from 'vue'

enum DIRECTION {
  START = -1,
  END = 1,
}

export type UseScrollOnParams = {
  /** When the scroll begins. Default to 50px */
  offset?: number
  /** Amount of pixels to scroll per tick. Default to 30px */
  speed?: number
  axis: 'x' | 'y'
  scrollingElRef: Ref<HTMLElement>
  isFireable: Ref<boolean | string | undefined | null>
}
export const useBorderScroll = (params: UseScrollOnParams) => {
  const { offset = 50, speed = 15, axis, scrollingElRef, isFireable } = params

  const scrollingEl = ref<HTMLElement>() as Ref<HTMLElement>
  onMounted(() => {
    scrollingEl.value = scrollingElRef.value
  })

  const scrollState = reactive({
    active: false,
    direction: DIRECTION.END,
    speed,
  })

  const checkAndScroll = (e: DragEvent | MouseEvent) => {
    if (!isFireable.value) return

    const { width, height, x, y } = scrollingEl.value.getBoundingClientRect()
    const [pos, size] = axis === 'y' ? [y, height] : [x, width]

    const isMouseOnStartSide = e[axis] < pos + offset
    const isMouseOnEndSide = e[axis] > pos + size - offset
    scrollState.active = isMouseOnStartSide || isMouseOnEndSide
    scrollState.direction = isMouseOnStartSide ? DIRECTION.START : DIRECTION.END
  }

  const scrollIt = () => {
    const move = scrollState.speed * scrollState.direction
    axis === 'x'
      ? scrollingEl.value.scrollBy(move, 0)
      : scrollingEl.value.scrollBy(0, move)
    if (scrollState.active) {
      setTimeout(scrollIt, 5)
    }
  }
  // scroll if state is active
  watchEffect(() => {
    if (scrollState.active) scrollIt()
  })
  // stop scroll if it is not allowed to trigger anymore
  watchEffect(() => {
    if (!isFireable.value) scrollState.active = false
  })

  return {
    checkAndScroll,
    borderScrollState: scrollState,
  }
}
