// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export const findingsLabel = (
  amount: number | null | undefined,
): string | undefined =>
  amount && amount > 0
    ? `${amount} unresolved finding${amount > 1 ? 's' : ''}`
    : undefined
