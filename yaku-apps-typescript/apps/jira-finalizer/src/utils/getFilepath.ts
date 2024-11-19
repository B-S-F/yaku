// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { readdir, stat } from 'fs/promises'
import path from 'path'

async function getFilesRecursive(dir: string): Promise<string[]> {
  const files: string[] = []
  for (const file of await readdir(dir)) {
    const fullPath = path.join(dir, file)
    const stats = await stat(fullPath)
    if (stats.isDirectory()) {
      files.push(...(await getFilesRecursive(fullPath)))
      continue
    }
    files.push(fullPath)
  }
  return files
}

export default async function (
  dirpath: string,
  filename: string
): Promise<string> {
  const files: string[] = await getFilesRecursive(dirpath)
  const file = files.find((file) => file.endsWith(filename))
  if (file) {
    return file
  } else {
    throw new Error(`File ${filename} not found in ${dirpath}`)
  }
}
