// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

// ------------------------------------------
//  A group of utilities to handle the files
// ------------------------------------------

import { SimpleFileItem } from '~/types'

/**
 * Get the name and the extension of the file.
 * If the file can have multiple extensions, such as .schema.json,
 * then it is returned as one string.
 */
export const splitNameAndExt = (filename: string) => {
  const parts = filename.split('.')
  if (parts.length <= 1) {
    return {
      basename: filename,
      ext: undefined,
    }
  } else {
    return {
      basename: parts[0],
      ext: parts.slice(1).join('.'),
    }
  }
}

export const getFileObject = (file: SimpleFileItem): File => {
  const { filename, content } = file
  const parts = [new Blob([content ?? ''])]
  return new File(parts, filename)
}

export const MAX_CONFIG_FILE_SIZE = 10 * 1024 * 1024
