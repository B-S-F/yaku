// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { useEventListener } from '@vueuse/core'
import { Ref, ref, watchEffect } from 'vue'

export type ColorScheme = 'dark' | 'light'

const colorScheme: Ref<ColorScheme | null> = ref(null)
const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)')
const listener = ref<ReturnType<typeof useEventListener>>()
/**
 * Color scheme priority, high to low:
 * 1. Current user Override should always be the top priority
 * 2. Then sync with the system change if there is no existing override
 * 3. On toggle, match user preference and save for next session
 * 4. Should always fallback to system default in case no override exists
 */
export const useColorScheme = () => {
  const checkMedia = () => {
    const existingColorOverride = localStorage.getItem(
      'colorSchemeUserOverride',
    ) as ColorScheme | null
    // 1. Always go with the current user Override first
    if (
      existingColorOverride !== null &&
      ['light', 'dark'].includes(existingColorOverride)
    ) {
      colorScheme.value = existingColorOverride
    } else {
      // 1. If system settings change, resync with system settings
      colorScheme.value = colorSchemeQuery.matches ? 'dark' : 'light'
      // localStorage.removeItem('colorSchemeUserOverride')
    }
  }
  if (listener.value === undefined) {
    listener.value = useEventListener(colorSchemeQuery, 'change', checkMedia)
  }
  const toggleColorScheme = () => {
    // 3. On toggle, match user preference and save for next session
    colorScheme.value = colorScheme.value === 'light' ? 'dark' : 'light'
    localStorage.setItem('colorSchemeUserOverride', colorScheme.value)
  }
  watchEffect(() => {
    if (colorScheme.value === 'dark') {
      document.body.classList.add('-dark-mode')
    } else {
      document.body.classList.remove('-dark-mode')
    }
  })
  colorScheme.value = localStorage.getItem(
    'colorSchemeUserOverride',
  ) as ColorScheme | null
  if (!colorScheme.value) {
    // 4. Use system settings as default
    checkMedia()
  }
  return { colorScheme, toggleColorScheme }
}
