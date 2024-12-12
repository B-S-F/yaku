// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export type ConfirmDialogProps = {
  id: string
  type: 'warning' | 'info' | 'success' | 'error'
  title: string
  headline?: string
  content: string
  confirmLabel?: string
  cancelLabel?: string
}
