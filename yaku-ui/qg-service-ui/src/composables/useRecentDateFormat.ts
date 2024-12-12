// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { DEFAULT_FORMAT_OPTS, formatDateToLocale, isUTC } from '~/utils'

const UnitToMs = {
  SECOND: 1000,
  MINUTE: 1 * 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
} as const

type UseRecentDateOptions = {
  forceDateString?: boolean
}
export const useRecentDateFormat = (
  dateInput: Date | string,
  { forceDateString }: UseRecentDateOptions = {},
): string => {
  const date = new Date(dateInput)
  const datestr =
    dateInput instanceof Date ? dateInput.toISOString() : dateInput
  const timeDelta = new Date().getTime() - date.getTime()

  if (forceDateString) {
    return isUTC(datestr)
      ? new Date(dateInput).toLocaleDateString(undefined, DEFAULT_FORMAT_OPTS)
      : formatDateToLocale(date)
  }
  // recent date formats
  if (timeDelta < UnitToMs.MINUTE) return `one moment ago`
  if (timeDelta < UnitToMs.HOUR) {
    const minutes = Math.trunc(timeDelta / UnitToMs.MINUTE)
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  }
  if (timeDelta < UnitToMs.DAY) {
    const hours = Math.trunc(timeDelta / UnitToMs.HOUR)
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  }
  // back to default formatting
  return isUTC(datestr)
    ? new Date(dateInput).toLocaleDateString(undefined, DEFAULT_FORMAT_OPTS)
    : formatDateToLocale(date)
}
