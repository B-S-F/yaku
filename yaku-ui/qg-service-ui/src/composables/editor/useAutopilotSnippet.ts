// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { editor, IRange } from 'monaco-editor'
import type { Result } from '~/types/utils'
import type { Autopilot, AutopilotSnippet } from '~/types/Autopilot'
import { ref, Ref } from 'vue'
import {
  dumpAutopilot,
  dumpConfiguration,
  loadConfiguration,
} from '~/helpers/configurationYaml'

/**
 * The snippet gets the following css class
 */
const SNIPPET_CLASS = 'aqua-snippet-inserted-block'

const defineRangeFromLines = (
  model: editor.ITextModel,
  firstLine: string,
  lastLine: string,
): IRange | undefined => {
  const firstLineMatch = model.findNextMatch(
    firstLine,
    { lineNumber: 0, column: 0 },
    false,
    false,
    null,
    false,
  )
  if (!firstLineMatch) return
  const { startLineNumber, startColumn } = firstLineMatch.range
  const lastLineMatch = model.findNextMatch(
    lastLine,
    { lineNumber: startLineNumber, column: startColumn },
    false,
    false,
    null,
    false,
  )
  if (!lastLineMatch) return
  const { endLineNumber, endColumn } = lastLineMatch.range
  return { startLineNumber, startColumn, endLineNumber, endColumn }
}

type UseAutopilotSnippetParams = {
  editorRef?: editor.IStandaloneCodeEditor
  currentFile: Ref<string>
}
export const useAutopilotSnippet = (params: UseAutopilotSnippetParams) => {
  const { currentFile, editorRef } = params

  let editor = editorRef
  const shouldTriggerHighlightOn = ref<string[]>()
  let decorationCollection: editor.IEditorDecorationsCollection

  const highlightAutopilotCode = (editor: editor.IStandaloneCodeEditor) => {
    // trigger only if an autopilot is inserted
    if (!shouldTriggerHighlightOn.value) return
    const model = editor.getModel()
    if (!model) return
    const decorations = shouldTriggerHighlightOn.value.reduce(
      (acc, searchString) => {
        const searchLines = searchString.split('\n')
        const [firstLine, lastLine] = [
          searchLines[0],
          searchLines[searchLines.length - 2],
        ]
        const range = defineRangeFromLines(model, firstLine, lastLine)
        if (!range) return acc
        // apply a class on the range
        const decoration: editor.IModelDeltaDecoration = {
          range,
          options: {
            blockClassName: SNIPPET_CLASS,
          },
        }
        acc.push(decoration)
        return acc
      },
      [] as editor.IModelDeltaDecoration[],
    )
    decorationCollection = editor.createDecorationsCollection(decorations)
    shouldTriggerHighlightOn.value = []
  }

  /** set the editor programmaticaly if it is not directly available */
  const bindEditor = (editorRef: editor.IStandaloneCodeEditor) => {
    editor = editorRef
    editor.onDidChangeModelContent(() => {
      if (decorationCollection) {
        decorationCollection.clear()
      }
      highlightAutopilotCode(editorRef)
    })
  }

  const convertToSnippet = (autopilot: Autopilot): AutopilotSnippet => {
    const env = autopilot.apps.reduce(
      (acc, app) => {
        app.envs.forEach((env) => {
          acc[env.name] = `// ${env.optional ? '(optional)' : 'TODO'}`
        })
        return acc
      },
      {} as AutopilotSnippet['env'],
    )

    const run = autopilot.apps.reduce(
      (acc, app) =>
        acc.concat(app.name.toLowerCase().replaceAll(' ', '-'), '\n'),
      '',
    )

    return {
      run,
      env,
    }
  }

  const addAutopilotToFile = (
    autopilot: Autopilot,
  ): Result<undefined, string> => {
    const name = autopilot.name.toLowerCase().replaceAll(' ', '-')
    const jsonConfig = loadConfiguration(currentFile.value)

    if (jsonConfig.autopilots[name]) {
      return {
        ok: false,
        err: `This autopilot "${name}" already exists in the configuration`,
      }
    }

    const snippet = convertToSnippet(autopilot)
    jsonConfig.autopilots[name] = snippet
    shouldTriggerHighlightOn.value = [dumpAutopilot({ [name]: snippet })]
    currentFile.value = dumpConfiguration(jsonConfig)
    return { ok: true }
  }

  return {
    bindEditor,
    addAutopilotToFile,
  }
}
