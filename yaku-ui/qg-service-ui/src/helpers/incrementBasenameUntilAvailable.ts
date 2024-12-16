// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { splitNameAndExt, suffixer } from '~utils'

export const incrementBasenameUntilAvailable = (
  filename: string,
  fileReferences: { basename: string; ext?: string }[],
): string => {
  const file = splitNameAndExt(filename)
  const validator = (basename: string) =>
    !fileReferences.find((f) => f.basename === basename && f.ext === file.ext)
  return `${suffixer(file.basename, validator)}.${file.ext}`
}

export const incrementNameUntilAvailable = (
  name: string,
  nameReferences: string[],
): string => {
  const validator = (name: string) => !nameReferences.includes(name)
  return suffixer(name, validator)
}
