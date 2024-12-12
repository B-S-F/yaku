// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export type PendingAction = {
  action: 'approve' | 'reset' | 'add-approver' | 'remove-approver'
  userId: string | number
}
