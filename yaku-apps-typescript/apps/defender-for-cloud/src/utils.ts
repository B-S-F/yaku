// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import fs from 'fs/promises'
import fs_sync from 'fs'
import path from 'path'

export async function exportJson(jsonContent: any, outputPath: string) {
  const dirName = path.dirname(outputPath)
  if (!fs_sync.existsSync(dirName)) {
    fs_sync.mkdirSync(dirName, { recursive: true })
  }
  await fs.writeFile(outputPath, JSON.stringify(jsonContent))
}
