// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

// ---------------
//  CLI Utilities
// ---------------
// these are mostly used for the autopilot script data manipulation

const formatValue = (v: string) => (v.includes(' ') ? `"${v}"` : v)
export const formatCliValue = formatValue

/**
 *
 * @param name the parameter name
 * @param value the parameter value, if not a flag
 */
export const formatParameter = (name: string, value = '') =>
  `--${name}${value ? `=${formatValue(value)}` : ''}`
