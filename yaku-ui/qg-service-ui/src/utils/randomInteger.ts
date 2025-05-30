// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export const randomInteger = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min
