// SPDX-FileCopyrightText: 2022 2023 by grow platform GmbH
// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export enum CheckGeneralResult {
  undefinedField = 'undefinedField',
  invalid = 'invalid',
  overdue = 'overdue',
  undefinedDueDate = 'undefinedDueDate',
  valid = 'valid',
}

export enum Conditions {
  exists = 'exists',
  expected = 'expected',
  illegal = 'illegal',
  resolved = 'resolved',
}

export interface Issue {
  [key: string]: any
}

export interface Dictionary {
  [key: string]: any
}

export interface InvalidResolvedValues {
  [CheckGeneralResult.overdue]: Issue[]
  [CheckGeneralResult.undefinedDueDate]: Issue[]
}

export interface InvalidIssues {
  [key: string]: {
    [Conditions.exists]: Issue[]
    [Conditions.expected]: Issue[]
    [Conditions.illegal]: Issue[]
    [Conditions.resolved]: InvalidResolvedValues
  }
}
