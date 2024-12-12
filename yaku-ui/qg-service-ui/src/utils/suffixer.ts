// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

/**
 * Append a suffix "-n" (where n is a number) to the name until the validator callback pass.
 * It can return the same string if the validator passes the first time.
 */
export const suffixer = (
  name: string,
  validator: (name: string) => boolean,
  i = 0,
): string => {
  const normalizedName = name.match(/-\d+$/)
    ? name.split('-').slice(0, -1).join('-')
    : name
  const nameCandidate = i > 0 ? `${normalizedName}-${i}` : normalizedName
  return validator(nameCandidate)
    ? nameCandidate
    : suffixer(name, validator, ++i)
}
