// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export * from './array'
export * from './date'
export * from './file'
export * from './formatMdContent'
export * from './getLargestRemainder'
export * from './getProfilePictureFromName'
export * from './getTimeFromMs'
export * from './randomInteger'
export * from './serializer'
export * from './string'
export * from './suffixer'
export * from './textFormatter'
export * from './yaml'

/** A simple way to suffix an "s" depending of the quantity */
export const pluralize = (count: number) => (count !== 1 ? 's' : '')
