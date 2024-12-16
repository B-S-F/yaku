// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { Component } from 'vue'

export type StatusColors =
  | 'Success'
  | 'MajorWarning'
  | 'Warning'
  | 'LightError'
  | 'Error'
  | 'Unknown'
  | 'Info'

type StatusPillDisplayBase = {
  color: StatusColors
  label: string
  tooltip: string
}

type Icon =
  | {
      icon: undefined
      iconComponent: Component
    }
  | {
      icon: string
      iconComponent: undefined
    }

export type StatusPillDisplay = StatusPillDisplayBase & Icon

/** A status pill without icon, so simplified to a color and its text. */
export type Badge = {
  color: StatusColors
  label: string
}
