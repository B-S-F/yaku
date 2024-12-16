// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { IPosition, editor } from 'monaco-editor'
import { DOUBLE_HYPHEN } from '~/config/app'
import type {
  AutopilotDefPath,
  AutopilotPath,
  CheckPath,
  CodeJump,
  RequirementPath,
} from '~/types/Editor'
import { toYamlKey } from '~/utils'

enum ScrollType {
  Smooth = 0,
  Immediate = 1,
}

type UseJumpToCodeOptions = {
  onEnd?: CallableFunction
}

/**
 * Move the cursor in a yaml configuration to the specified jump path
 *
 * @param editor the monaco editor
 * @param jump the expected path to jump to
 * @param options provide more options such as an onSuccess callback
 */
export const useJumpToCode = (
  editor: editor.IStandaloneCodeEditor,
  jump: CodeJump,
  options: UseJumpToCodeOptions = {},
) => {
  // 1.set the order in which the line content have to be found
  const order: RegExp[] = []
  if (jump.type === 'autopilotDef') {
    order.push(/autopilots/, toYamlKey(jump.path.autopilotId))
  } else {
    order.push(/chapters:/, toYamlKey(jump.path.chapterId))
    order.push(/requirements:/, toYamlKey(jump.path.requirementId))
    if (jump.type === 'check')
      order.push(/checks:/, toYamlKey(jump.path.checkId))
    if (jump.type === 'autopilot')
      order.push(
        /checks:/,
        toYamlKey(jump.path.checkId),
        /automation:/,
        /autopilot:/,
      )
    if (jump.type === 'manual')
      order.push(/checks:/, toYamlKey(jump.path.checkId), /manual:/)
  }

  editor.focus()
  const model = editor.getModel()
  if (!model) return

  // 2. iterate over the lines and search for all order elements. Stops when all order elements are found (step is undefined).
  let [jumpLinePosition, step] = [0, order.shift()]
  const lines = model.getLinesContent()
  for (let i = 0; i < lines.length; i++) {
    if (!step) break
    if (step.test(lines[i])) {
      ;[jumpLinePosition, step] = [i + 1, order.shift()]
    }
  }

  // 3. Jump to the corresponding line
  const pos: IPosition = {
    lineNumber: jumpLinePosition,
    column: model.getLineLength(jumpLinePosition) + 1,
  }
  editor.setPosition(pos)
  editor.revealLineNearTop(pos.lineNumber, ScrollType.Smooth)
  if (options.onEnd) options.onEnd()
}

/** helpers to pass the information between views with a URL query parameter */
export const serializeAutopilotDefJump = (p: AutopilotDefPath) =>
  `autopilots${DOUBLE_HYPHEN}${p.autopilotId}`
export const serializeAutopilotJump = (p: AutopilotPath) =>
  `chapter${DOUBLE_HYPHEN}${p.chapterId}${DOUBLE_HYPHEN}requirement${DOUBLE_HYPHEN}${p.requirementId}${DOUBLE_HYPHEN}check${DOUBLE_HYPHEN}${p.checkId}${DOUBLE_HYPHEN}autopilot`
export const serializeManualJump = (p: CheckPath) =>
  `chapter${DOUBLE_HYPHEN}${p.chapterId}${DOUBLE_HYPHEN}requirement${DOUBLE_HYPHEN}${p.requirementId}${DOUBLE_HYPHEN}check${DOUBLE_HYPHEN}${p.checkId}${DOUBLE_HYPHEN}manual`
export const serializeCheckJump = (p: CheckPath) =>
  `chapter${DOUBLE_HYPHEN}${p.chapterId}${DOUBLE_HYPHEN}requirement${DOUBLE_HYPHEN}${p.requirementId}${DOUBLE_HYPHEN}check${DOUBLE_HYPHEN}${p.checkId}`
export const serializeRequirementJump = (p: RequirementPath) =>
  `chapter${DOUBLE_HYPHEN}${p.chapterId}${DOUBLE_HYPHEN}requirement${DOUBLE_HYPHEN}${p.requirementId}`

export const deserializeJump = (input: string): CodeJump | undefined => {
  const segments = input.split(DOUBLE_HYPHEN) ?? []
  const [root, end] = [segments.at(0), segments.at(-1)]
  if (root === 'autopilots') {
    return {
      type: 'autopilotDef',
      path: {
        autopilotId: segments.slice(1).join(DOUBLE_HYPHEN),
      },
    }
  } else if (root === 'chapter') {
    const checkId = segments.at(5)
    if (checkId) {
      const path = {
        chapterId: segments[1],
        requirementId: segments[3],
        checkId: segments[5],
      }
      const type: 'autopilot' | 'manual' | 'check' =
        end === 'autopilot' || end === 'manual' ? end : 'check'
      return { type, path }
    }
    return {
      type: 'requirement',
      path: {
        chapterId: segments[1],
        requirementId: segments[3],
      },
    }
  }
}
