// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

const getAvatarColors = (name: string, colors: string[]): string => {
  let bestMatch = null
  let maxLetters = 0

  colors.forEach((color) => {
    let matchingLetters = 0
    for (let i = 0; i < name.length; i++) {
      if (color.includes(name[i])) {
        matchingLetters++
      }
    }
    if (matchingLetters > maxLetters) {
      bestMatch = color
      maxLetters = matchingLetters
    }
  })

  return bestMatch || colors[Math.floor(Math.random() * colors.length)]
}

export default getAvatarColors
