// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export const getFilenameFromApiUrl = (v: string): string =>
  decodeURIComponent(v.split('/').at(-1) as string)
