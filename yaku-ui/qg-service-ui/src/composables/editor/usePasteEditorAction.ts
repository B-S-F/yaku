// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { editor } from 'monaco-editor'

type UseSecretCompletionParams = {
  editor: editor.IStandaloneCodeEditor
}
/**
 * Add the paste action in the right click menu.
 * It is only intended for Firefox as the action does only work with the keyboard.
 */
export const usePasteEditorAction = (params: UseSecretCompletionParams) => {
  const { editor } = params

  const isFirefox = navigator.userAgent.indexOf('Firefox') != -1
  if (isFirefox) {
    editor.addAction({
      id: 'myPaste',
      label: `Paste (only with keyboard shortcut on firefox)`,
      contextMenuOrder: 3,
      contextMenuGroupId: '9_cutcopypaste',
      // empty command as firefox can not read from the clipboard. The user has to use keyboard shortcuts.
      run: () => {},
      // run: async (editor) => {
      //   const text = await window.navigator.clipboard.readText()
      //   insertTextAtCursor(editor, text, "secret completion")
      // }
    })
  }
}
