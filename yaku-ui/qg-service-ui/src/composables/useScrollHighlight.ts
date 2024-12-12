// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { useMounted } from '@vueuse/core'
import { MaybeRef, nextTick, unref, watchEffect } from 'vue'

type UseScrollHighlightParams = {
  targetId?: MaybeRef<string | undefined>
  highlightDuration?: number
}

/**
 * Needs ~/scss/components/scroll.scss to be loaded for the css effects
 * @param params
 */
export const useScrollHighlight = (params: UseScrollHighlightParams = {}) => {
  const isMounted = useMounted()

  const scrollTo = async (targetId: string) => {
    if (!isMounted.value) return
    const node = document.getElementById(targetId)
    // add smooth effect
    node?.classList.add('yaku-scroll-highlight')
    await nextTick()
    node?.scrollIntoView({
      block: 'start',
      inline: 'nearest',
      behavior: 'smooth',
    })
    node?.classList.add('yaku-highlighting')

    const highlightDuration = params.highlightDuration ?? 1500
    setTimeout(
      () => node?.classList.remove('yaku-highlighting'),
      highlightDuration,
    )
    // add smooth effect
    setTimeout(
      () => node?.classList.remove('yaku-scroll-highlight'),
      highlightDuration + 1000,
    )
  }

  /** reactive scroll behavior on prop changes */
  watchEffect(async () => {
    const targetId = unref(params.targetId)
    if (!targetId || !isMounted.value) return
    scrollTo(targetId)
  })

  return {
    scrollTo,
  }
}
