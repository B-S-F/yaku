// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export interface Step {
  label?: string
  description?: string
}

export interface SelectItem<V = string | number> {
  value: V
  label: string
}

export interface Mapping {
  label: string
  description?: string
}
