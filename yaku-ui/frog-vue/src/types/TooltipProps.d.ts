// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export type TooltipProps = {
  type?: 'success' | 'warning' | 'error' | 'neutral'
  width?: 'dynamic' | 'fixed'
  label: string
}
