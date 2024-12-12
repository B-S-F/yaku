// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export type ArrowPlacement =
  | '-top-left'
  | '-top-center'
  | '-top-right'
  | '-bottom-left'
  | '-bottom-center'
  | '-bottom-right'
  | '-left-top'
  | '-left-center'
  | '-left-bottom'
  | '-right-top'
  | '-right-center'
  | '-right-bottom'
  | '-without-arrow-bottom'
  | '-without-arrow-top'

export type Direction = 'top' | 'right' | 'bottom' | 'left'

export type Placement = Direction | 'center'
