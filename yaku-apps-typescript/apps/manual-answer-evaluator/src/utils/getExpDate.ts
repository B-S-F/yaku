/**
 * Copyright (c) 2022, 2023 by grow platform GmbH
 */

import parse from 'parse-duration'

export const getExpDate = (modDate: Date, expTime: string): Date => {
  const expTimeValue = parse(expTime)
  const expDate = new Date(modDate.getTime() + expTimeValue)
  return expDate
}
