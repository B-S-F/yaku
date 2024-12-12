// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { IPosition, editor } from 'monaco-editor'

// -------------------------------------
//  A group of utilities for the editor
// -------------------------------------

/** quick util function to insert some text in the editor at the cursor position */
export const insertTextAtCursor = (
  editor: editor.IStandaloneCodeEditor | editor.ICodeEditor,
  text: string,
  source?: string,
) => {
  const selection = editor.getSelection()
  if (!selection) return
  const op = { range: selection, text: text, forceMoveMarkers: true }
  editor.executeEdits(source, [op])
}

export const getCharAtCursor = (editor: editor.IStandaloneCodeEditor) => {
  const model = editor.getModel() as editor.ITextModel
  const position = editor.getPosition() as IPosition
  return model.getLineContent(position.lineNumber).at(position.column - 1)
}
