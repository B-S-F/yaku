// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

const nextChar = (c: string) =>
  c ? String.fromCharCode(c.charCodeAt(0) + 1) : 'A'
const nextCol = (s: string) =>
  s.replace(/([^Z]?)(Z*)$/, (_, a, z) => nextChar(a) + z.replace(/Z/g, 'A'))

export function* sheetColumnNameIterator() {
  let prev = ''
  while (true) {
    prev = nextCol(prev)
    yield prev
  }
}

/**
 * Unefficient helper that consumes an iterator until the index is reached
 * @param index
 */
export const getSheetColumnNameFromIndex = (index: number) => {
  const it = sheetColumnNameIterator()
  for (let i = 0; i < index; i++) it.next()
  return it.next().value as string
}
