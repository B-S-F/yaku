// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export type Output = {
  [key: string]: string
}

export type Status = 'GREEN' | 'YELLOW' | 'RED' | 'FAILED'

export type Result = {
  criterion: string
  justification: string
  fulfilled: boolean
  metadata?: {
    [key: string]: string
  }
}
