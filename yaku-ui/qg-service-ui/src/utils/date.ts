// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import spacetime from 'spacetime'

export const getLastMonths = (monthsBack: number) => {
  const d = spacetime.now()
  return d.subtract(monthsBack, 'month').toNativeDate()
}

export const getLastDays = (days: number) => {
  const d = spacetime.now()
  return d.subtract(days, 'days').toNativeDate()
}

/**
 * Based on an UTC date, it adds the timezone offset to get the date
 * in local time of the user.
 * See https://www.w3schools.com/jsref/jsref_gettimezoneoffset.asp
 */
export const addTimezoneOffset = (d: Date) => {
  const timezoneOffsetMs = new Date().getTimezoneOffset() * 60 * 1000
  return new Date(d.getTime() - timezoneOffsetMs)
}

export const isUnixEpoch = (s: string) => s === '1970-01-01T00:00:00.000Z'

export const formatDateToCET = (d: Date | string) =>
  new Date(d).toLocaleString('sv', { timeZone: 'Europe/Paris' })

export const DEFAULT_FORMAT_OPTS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
}
/** Format the date to the browser locale and the proper timezone. */
export const formatDateToLocale = (d: Date, opts = DEFAULT_FORMAT_OPTS) =>
  addTimezoneOffset(d).toLocaleDateString(undefined, opts)
export const getHumanDateTime = (
  date: Date | string,
  showTime = false,
): string => {
  const _date = new Date(date)
  if (isNaN(_date.getTime()) || date === null) return '-'
  const [year, month, day, hour, mins] = _date
    .toISOString()
    .split(/[^0-9]/)
    .slice(0, -1)
  return showTime
    ? `${day}.${month}.${year.slice(2)}, ${hour}:${mins}`
    : `${day}.${month}.${year.slice(2)}`
}

export const isUTC = (datestr: string): boolean => {
  try {
    if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(datestr))
      return false
    const obj = new Date(datestr)
    return obj instanceof Date && !isNaN(obj.getTime())
  } catch (err) {
    console.error(err)
    return false
  }
}

export const getEarliestPossibleReleaseDate = () =>
  new Date().toISOString().split('T')[0]
