// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { SecretMetadata } from '~/types'
import type { editor, Position } from 'monaco-editor'
import { languages } from 'monaco-editor'
import { MaybeRef, unref } from 'vue'
import { MONACO_CONTEXT_MENU_GROUP_YAKU } from '~/config/app'
import { getCodeFromSecret } from '~/helpers'

const ADD_SECRET_COMMAND: languages.Command = {
  id: 'create-secret',
  title: 'Create a Secret',
}

const ADD_SECRET_SUGGESTION: Omit<languages.CompletionItem, 'range'> = {
  label: `Create a Secret`,
  detail: `{{command}}`,
  kind: languages.CompletionItemKind.Event,
  insertText: '',
  // trick the order so this suggestion will come at the end of the suggestion-widget
  sortText: 'z Create a Secret',
  command: ADD_SECRET_COMMAND,
  insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
}

type SecretToSuggestionOptions = {
  withRightBracket?: boolean
  withRightBrackets?: boolean
}
const secretToSuggestion = (
  secret: SecretMetadata,
  { withRightBracket, withRightBrackets }: SecretToSuggestionOptions = {},
): Omit<languages.CompletionItem, 'range'> => ({
  label: ` ${secret.name}`,
  detail: `{{secret}} ${secret.description ?? ''}`,
  kind: languages.CompletionItemKind.Constant,
  insertText: getCodeFromSecret(secret.name, {
    withLeftBracket: false,
    withRightBracket,
    withDollarSign: false,
    withRightBrackets,
  }),
})

const getRange = (model: editor.ITextModel, position: Position) => {
  const { startColumn, endColumn } = model.getWordUntilPosition(position)
  return {
    startLineNumber: position.lineNumber,
    endLineNumber: position.lineNumber,
    startColumn,
    endColumn,
  }
}

type UseSecretCompletionParams = {
  editor: editor.IStandaloneCodeEditor
  secrets: MaybeRef<SecretMetadata[]>
  onAddSecret: editor.ICommandDescriptor['run']
}
export const useSecretCompletion = (params: UseSecretCompletionParams) => {
  const { editor, secrets, onAddSecret } = params

  // register the action
  editor.addAction({
    id: 'yaku.action.createSecret',
    label: ADD_SECRET_COMMAND.title,
    contextMenuOrder: 100,
    contextMenuGroupId: MONACO_CONTEXT_MENU_GROUP_YAKU,
    run: onAddSecret,
  })

  const provider = languages.registerCompletionItemProvider('yaml', {
    triggerCharacters: ['$', '{}', '{'],
    resolveCompletionItem: (item) => {
      const model = editor.getModel() as editor.IModel
      const position = editor.getPosition() as Position

      // Get the text before the cursor's position
      const textLine = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 0,
        endLineNumber: position.lineNumber,
        endColumn: position.column + 1,
      })

      // if the trigger character was '$', add '{'
      // else add '$'
      const indexLeftBracket = textLine.lastIndexOf('{')
      const indexDollarSign = textLine.lastIndexOf('$')

      let missingCharacter = ''
      if (indexLeftBracket < 0) {
        missingCharacter = '{{'
      } else if (textLine[indexLeftBracket - 1] !== '{') {
        // only insert second bracket if not there
        missingCharacter = '{'
      }
      if (indexDollarSign < 0) {
        missingCharacter = '$' + missingCharacter
      }
      const index =
        indexLeftBracket < 0
          ? indexDollarSign + 2
          : missingCharacter.includes('{')
            ? indexLeftBracket + 1
            : indexLeftBracket

      item.additionalTextEdits = [
        {
          range: {
            startLineNumber: position.lineNumber,
            startColumn: index,
            endLineNumber: position.lineNumber,
            endColumn: index,
          },
          text: missingCharacter,
        },
      ]
      return item
    },
    provideCompletionItems: (model, position) => {
      const charInserted = model
        .getLineContent(position.lineNumber)
        .at(position.column - 1)
      const firstChar = model
        .getLineContent(position.lineNumber)
        .at(position.column - 3)
      const provideSuggestion = (s: SecretMetadata) =>
        secretToSuggestion(s, {
          withRightBracket: firstChar === '$' || charInserted !== '}',
          withRightBrackets: firstChar !== '{' && firstChar !== '$',
        })
      const range = getRange(model, position)
      return {
        suggestions: [
          ...unref(secrets).map(provideSuggestion),
          ADD_SECRET_SUGGESTION,
        ].map((s) => ({ ...s, range })),
      }
    },
  })

  editor.onDidDispose(provider.dispose)
}
