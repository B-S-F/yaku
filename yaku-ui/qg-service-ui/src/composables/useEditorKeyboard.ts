// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { MaybeRef, useEventListener } from '@vueuse/core'
import { unref } from 'vue'

type Trigger = {
  trigger: (
    e: Pick<
      KeyboardEvent,
      'altKey' | 'ctrlKey' | 'code' | 'metaKey' | 'shiftKey'
    >,
  ) => boolean
  action: CallableFunction
}

type UseEditorKeyboardParams = {
  triggers: MaybeRef<Trigger[]>
}
export const useEditorKeyboard = (params: UseEditorKeyboardParams) => {
  useEventListener(document, 'keydown', (event) => {
    const actions = unref(params.triggers).filter((t) => t.trigger(event))
    if (actions.length > 0) event.preventDefault()
    actions.forEach((t) => t.action())
  })
}
