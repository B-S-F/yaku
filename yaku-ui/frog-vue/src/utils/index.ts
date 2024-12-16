// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export const insertString = (original: string, inserted: string, pos: number) =>
  `${original.substring(0, pos)}${inserted}${original.substring(pos)}`
