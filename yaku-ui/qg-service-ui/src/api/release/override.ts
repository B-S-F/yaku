// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export type OverrideColor = 'YELLOW' | 'RED' | 'GREEN'
export type ReleaseOverride = {
  id: number
  reference: ReleaseOverrideReference
  commentId: number
  comment: string
  userId: string
  lastModificationTime: string
  originalColor: string
  manualColor: string
}

export type ReleaseOverrideReference = {
  chapter?: string
  requirement?: string
  check?: string
}
