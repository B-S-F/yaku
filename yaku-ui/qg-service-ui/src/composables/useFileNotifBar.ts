// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { MaybeRef } from '@vueuse/shared'
import { computed, unref } from 'vue'

type UseFileNotifBarParams = {
  isSaved: MaybeRef<boolean>
  hasChanges: MaybeRef<boolean>
  hasError: MaybeRef<boolean>
}
export const useFileNotifBar = (params: UseFileNotifBarParams) => {
  const { isSaved, hasChanges, hasError } = params

  const notifBar = computed(() => {
    if (unref(hasError)) {
      return {
        type: 'error' as const,
        label: 'Unresolved errors',
        customIcon: undefined, // reuse the default one
      }
    }
    if (unref(isSaved))
      return {
        type: 'success' as const,
        label: 'Saved changes',
        customIcon: undefined,
      }
    if (unref(hasChanges))
      return {
        type: 'info' as const,
        label: 'Unsaved changes',
        customIcon: 'info-i-frame', // default icon of the type "info"
      }
    return undefined
  })

  return {
    notifBar,
  }
}
