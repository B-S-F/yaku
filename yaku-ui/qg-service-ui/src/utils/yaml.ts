// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

/**
 * @param content the regex string that can be found in the key
 * @returns a regex matching a yaml key format
 */
export const toYamlKey = (content: string | number): RegExp =>
  new RegExp(`["']?${content}["']?:`)
