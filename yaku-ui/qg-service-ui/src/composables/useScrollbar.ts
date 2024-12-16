// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { useEventListener } from '@vueuse/core'
import {
  computed,
  onActivated,
  onDeactivated,
  onMounted,
  onUpdated,
  reactive,
  Ref,
  ref,
  watch,
  watchEffect,
} from 'vue'

type UseScrollbarParams = {
  axis: 'x' | 'y'
  container: Ref<HTMLElement | undefined>
  childSelector: string
  initialPos?: number
  forceRefresh?: Ref<number | string | boolean>
}

const MIN_SCROLLBAR_SIZE = 0.1 // in %
const MAX_SCROLLBAR_SIZE = 0.8 // in %

const boundInRange = (val: number, min: number, max: number) =>
  Math.max(min, Math.min(max, val))

/**
 * Facilitate the usage of the scrollbar component in the parent.
 */
export const useScrollbar = (params: UseScrollbarParams) => {
  const {
    axis,
    container,
    childSelector,
    initialPos,
    forceRefresh = { value: false },
  } = params

  /** the relative position between 0 and the container size. It is bound to native scroll position */
  const scrollPos = ref(initialPos ?? 0)
  const scrollBehavior = reactive<Pick<ScrollToOptions, 'behavior'>>({
    behavior: 'auto',
  })
  watchEffect(() => {
    const scrollToOpts: ScrollToOptions =
      axis === 'y'
        ? { top: scrollPos.value, ...scrollBehavior }
        : { left: scrollPos.value, ...scrollBehavior }
    container.value?.scrollTo(scrollToOpts)
  })

  /** scrollable element of the container. Set on mounted with a string selector */
  const child = ref<Element | null>()
  const setChild = (parent: HTMLElement) =>
    (child.value = parent.querySelector(childSelector) ?? null)
  onMounted(() => {
    if (container.value) setChild(container.value)
  })
  onUpdated(() => {
    if (!child.value && container.value) setChild(container.value)
  })

  /** Ratio between the container and the (scrollable) child */
  const scrollRatio = ref(0)
  const computeScrollRatio = () => {
    const property = axis === 'y' ? 'height' : 'width'
    scrollRatio.value = container.value
      ? (container.value.getBoundingClientRect()[property] ?? 1) /
        (child.value?.getBoundingClientRect()[property] ?? 1)
      : 1
  }

  const isScrollable = computed(() => scrollRatio.value < 1)

  const thumbSize = ref<number>()
  const getThumbSize = (ratio: number) =>
    boundInRange(ratio, MIN_SCROLLBAR_SIZE, MAX_SCROLLBAR_SIZE)
  watchEffect(() => (thumbSize.value = getThumbSize(scrollRatio.value)))

  /** scrollbar relative progress between 0 and 1 */
  const scrollbarProgress = computed(() => {
    if (!container.value || !child.value) return 0

    const childSize = child.value[axis === 'y' ? 'clientHeight' : 'clientWidth']
    const containerSize =
      container.value.getBoundingClientRect()[axis === 'y' ? 'height' : 'width']
    const progress =
      (scrollPos.value * (1 - (thumbSize.value ?? 0.1))) /
      (childSize - containerSize)

    // if the scrollbar progression is about to be bigger than 1, returns the max progress value possible
    const thumbSizeRatio = thumbSize.value ?? 1 // in interval ]0, 1[
    if (progress + thumbSizeRatio > 1) return 1 - thumbSizeRatio

    return progress
  })

  /** to bind to the scrollbar scroll event or other raw scroll actions. It automatically handles .scrollTo(). */
  const onScrollProgress = (relativeScroll: number) => {
    if (!container.value || !child.value) return

    const clientSize =
      child.value[axis === 'y' ? 'clientHeight' : 'clientWidth']
    const size =
      container.value.getBoundingClientRect()[axis === 'y' ? 'height' : 'width']

    scrollPos.value = Math.max(1, clientSize * relativeScroll - size)
  }
  /** wrapper to disable native event listener and add smoothiness */
  const onScrollProgrammatically = (callback: CallableFunction) => {
    canNativeScrollUpdate.value = false
    scrollBehavior.behavior = 'smooth'
    callback()
    setTimeout(() => {
      canNativeScrollUpdate.value = true
      scrollBehavior.behavior = 'auto'
    }, 200)
  }
  const scrollToStart = () =>
    onScrollProgrammatically(() => onScrollProgress(0))
  const scrollToEnd = () => onScrollProgrammatically(() => onScrollProgress(1))

  // ---------------------------------------------
  //  Handle natural scrolling with native events
  // ---------------------------------------------
  /** 1. Bounce during dragging to avoid too much computation, or disable listener */
  const canNativeScrollUpdate = ref(true)
  // 2. Handle scrolling
  const onChildScroll = (e: Event) => {
    if (!canNativeScrollUpdate.value) return

    canNativeScrollUpdate.value = false
    const t = e.target as HTMLElement
    scrollPos.value = axis === 'y' ? t.scrollTop : t.scrollLeft

    setTimeout(() => (canNativeScrollUpdate.value = true), 16)
  }

  // 3. Bind function with an event listener
  // passive to render the UI first, improve smooth scrolling
  useEventListener(container, 'scroll', onChildScroll, { passive: true })

  // --------------------------------------------------------
  //  Handle the refresh of values unrelated with the params
  // --------------------------------------------------------
  const active = ref(false)
  onActivated(() => (active.value = true))
  onDeactivated(() => (active.value = false))
  watch([forceRefresh, active], () => {
    if (container.value) {
      setChild(container.value)
      computeScrollRatio()
    }
  })

  return {
    scrollPos,
    scrollbarProgress,
    onScrollProgress,
    scrollToStart,
    scrollToEnd,
    thumbSize,
    isScrollable,
  }
}
