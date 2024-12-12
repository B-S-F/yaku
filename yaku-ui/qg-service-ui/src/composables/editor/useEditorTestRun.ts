// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { Position, editor } from 'monaco-editor'
import { useEventListener } from '@vueuse/core'
import { load } from 'js-yaml'
import { SingleCheck } from '~/api'
import { MONACO_CONTEXT_MENU_GROUP_YAKU } from '~/config/app'
import { OnyxConfiguration } from '~/types/OnyxConfiguration'
import { getCheckFrom, singleCheckToCheckPath } from '~/helpers'
import { useEditorTestRunHelpers } from './useEditorTestRunHelpers'

type UseEditorTestRunsParams = {
  editor: editor.IStandaloneCodeEditor
  callback: (singleCheck: SingleCheck) => void
}
export const useEditorTestRun = (params: UseEditorTestRunsParams) => {
  const { editor } = params

  /** the check of the specified path should have at least an autopilot to be run as test run */
  const validateCheckForTestRun = (
    configuration: OnyxConfiguration,
    path: SingleCheck | undefined,
  ) => {
    if (!path) return false
    try {
      const check = getCheckFrom(configuration, singleCheckToCheckPath(path))
      return !!check.automation?.autopilot
    } catch (e) {
      // the check can not be retrieved because the configuration is somehow incomplete
      return false
    }
  }

  /** key identifier to the condition that allow or remove the action in the editor context menu  */
  const TEST_RUN_CONDITION_KEY = 'start-test-run'
  /** bind the condition iteself to show or hide the action from the context menu */
  const showActionInContextMenu = editor.createContextKey<boolean>(
    TEST_RUN_CONDITION_KEY,
    false,
  )
  /** set it while opening the context menu and use it in the action item callback (run) */
  let actionPayload: SingleCheck | undefined

  const updateRunCheckAction = (
    model: editor.ITextModel | null,
    position: Position | null,
  ) => {
    /** bind both actionPayload and showContextMenu together with a setter function. */
    const updateAction = (check?: SingleCheck) => {
      actionPayload = check
      showActionInContextMenu.set(!!check)
    }
    const { extractSingleCheckPath } = useEditorTestRunHelpers()

    if (model === null || position === null) {
      updateAction()
      return
    }

    const configuration = model.getLinesContent()
    const endlineIndex = position.lineNumber - 1
    const singleCheckCandidate = extractSingleCheckPath(
      configuration,
      endlineIndex,
    )
    try {
      const onyxConfiguration = load(
        configuration.join('\n'),
      ) as OnyxConfiguration
      const isCheckValid =
        singleCheckCandidate &&
        validateCheckForTestRun(onyxConfiguration, singleCheckCandidate)
      updateAction(isCheckValid ? singleCheckCandidate : undefined)
    } catch (e) {
      // if the configuration file can not be parsed properly, it won't run well anyway
      showActionInContextMenu.set(false)
    }
  }

  editor.onContextMenu((e) => {
    const model = editor.getModel()
    const { position } = e.target
    updateRunCheckAction(model, position)
  })

  /** on command palette trigger */
  useEventListener('keyup', (e) => {
    if (e.key !== 'F1') return
    const model = editor.getModel()
    const position = editor.getPosition()
    updateRunCheckAction(model, position)
  })

  /**
   * if the action should be displayed dynamically in the context menu,
   * then https://microsoft.github.io/monaco-editor/playground.html?source=v0.44.0#example-interacting-with-the-editor-adding-a-command-to-an-editor-instance
   * would provide conditions to check if the item should be added in the context menu. See https://github.com/microsoft/monaco-editor/issues/724#issuecomment-410593518
   * for a direct example.
   * */
  editor.addAction({
    id: 'yaku.action.startTestRun',
    label: `Run selected Check`,
    contextMenuOrder: 100,
    contextMenuGroupId: MONACO_CONTEXT_MENU_GROUP_YAKU,
    precondition: TEST_RUN_CONDITION_KEY,
    run: () => {
      actionPayload ? params.callback(actionPayload) : undefined
      actionPayload = undefined
    },
  })
}
