// SPDX-FileCopyrightText: 2022 2023 by grow platform GmbH
// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { readFile, stat } from 'fs/promises'

export interface FileData {
  content: string
  mtime: string
}

export const readContentAndMtime = async (
  filename: string,
): Promise<FileData> => {
  const text = await readFile(filename, 'utf8')
  const { mtime } = await stat(filename)
  return { content: text, mtime: mtime.toISOString() }
}
