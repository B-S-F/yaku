// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

/**
 * Get unique objects of an array depending of a key value
 * @param arr the array with doublons
 * @param key the key of the array
 * @returns unique objects depending of the key
 */
export const uniqueBy = <T>(arr: T[], key: keyof T) =>
  arr.reduce((acc, v) => {
    if (!acc.find((el) => el[key] === v[key])) {
      acc.push(v)
    }
    return acc
  }, [] as T[])

export const getElementOrFirstInArray = <T>(el: T | T[]): T => {
  return Array.isArray(el) ? el[0] : el
}
