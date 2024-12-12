// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

const VOWELS = ['a', 'e', 'i', 'o', 'u', 'y']

const getClosestConsonant = (name: string, pos: number): string => {
  const candidate = name[pos]
  if (!VOWELS.includes(candidate.toLocaleLowerCase())) return candidate
  return getClosestConsonant(name, pos + 1)
}

export const getProfilePictureFromName = (name: string) => {
  const words = name.split(/[ -]/)
  const [first, last] = [words[0], words[words.length - 1]]

  if (first !== last) {
    return `${first[0]}${last[0]}`
  }

  if (first.length <= 6) {
    return `${first[0]}${first[first.length - 1]}`
  }

  const uppercaseAt = first.slice(1).search(/[A-Z]/)
  if (uppercaseAt !== -1) {
    return `${first[0]}${first[uppercaseAt + 1]}`
  }

  return `${first[0]}${getClosestConsonant(first, Math.trunc(first.length / 2) - 1)}`
}
