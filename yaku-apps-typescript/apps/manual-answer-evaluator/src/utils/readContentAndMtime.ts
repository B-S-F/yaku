/**
 * Copyright (c) 2022, 2023 by grow platform GmbH
 */

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
