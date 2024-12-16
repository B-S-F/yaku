// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export const capitalizeFirstLetter = (text: string) => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

export const quickHtmlTagStrip = (text: string) =>
  text.replace(/(<([^>]+)>)/gi, '')
