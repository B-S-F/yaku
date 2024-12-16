// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { useEventListener } from '@vueuse/core'
import { ref } from 'vue'

type UseResizeDnD = {
  onResize: (ev: MouseEvent) => any
}
export const useResizeDnD = (params: UseResizeDnD) => {
  const { onResize } = params
  const isResizing = ref(false)

  const resize = (e: MouseEvent) => {
    isResizing.value = true
    onResize(e)
  }

  const setResize = () => document.addEventListener('mousemove', resize, false)

  const releaseResize = () => {
    isResizing.value = false
    document.removeEventListener('mousemove', resize, false)
  }
  /** if the global event is triggered, then we remove the resize event listener */
  useEventListener('mouseup', releaseResize)

  return {
    isResizing,
    setResize,
  }
}
