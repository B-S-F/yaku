// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { SingleCheck } from '~/api'
import { EditorFile } from '~/composables/useEditorFiles'
import { DOUBLE_HYPHEN } from '~/config/app'
import { Run, RunState } from '~/types'

export type EditorType = 'code' | 'visual'

export type EditorFileErrorUpdate = { filename: string; value: number }

export type SimpleFileItem = {
  filename: string
  content?: string | File
  text?: string
}

export type SetFileParams = Omit<EditorFile, 'id' | 'sourceUrl'>

// ---------------
//  Visual Editor
// ---------------
/** content navigation similar to a code jump */
export type ConfigurationSection =
  | `chapter${typeof DOUBLE_HYPHEN}${string}`
  | `chapter${typeof DOUBLE_HYPHEN}${string}${string}${typeof DOUBLE_HYPHEN}${string}check${typeof DOUBLE_HYPHEN}${string}${string}`
/** every possible navigation slection of the visual editor */
export type SelectedSection =
  | 'globals'
  | 'autopilots'
  | ConfigurationSection
  | undefined

/** custom type for the UI in order to make the test run coherent */
export type TestRun = RunState &
  Pick<Run, 'id' | 'creationTime' | 'completionTime' | 'log'> & {
    check: { context: SingleCheck; name: string }
  }

// --- Code Jump ---
export type CodeJump =
  | RequirementJump
  | CheckJump
  | ManualJump
  | AutopilotCheckCodeJump
  | AutopilotDefCodeJump

export type AutopilotDefCodeJump = {
  type: 'autopilotDef'
  path: {
    autopilotId: string
  }
}
export type AutopilotDefPath = Pick<AutopilotDefCodeJump, 'path'>['path']

export type AutopilotCheckCodeJump = {
  type: 'autopilot'
  path: CheckPath
}
export type AutopilotPath = Pick<AutopilotCheckCodeJump, 'path'>['path']
export type AppPath = AutopilotPath

export type CheckJump = {
  type: 'check'
  path: {
    chapterId: string
    requirementId: string
    checkId: string
  }
}
export type CheckPath = Pick<CheckJump, 'path'>['path']

export type ManualJump = {
  type: 'manual'
  path: CheckPath
}

export type RequirementJump = {
  type: 'requirement'
  path: {
    chapterId: string
    requirementId: string
  }
}
export type RequirementPath = Pick<RequirementJump, 'path'>['path']

export type EnvVariableInput = {
  name: string
  defaultValue: string
  value?: string
}
