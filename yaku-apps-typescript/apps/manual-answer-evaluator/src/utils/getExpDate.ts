// SPDX-FileCopyrightText: 2022 2023 by grow platform GmbH
// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import parse from 'parse-duration'

export const getExpDate = (modDate: Date, expTime: string): Date => {
  const expTimeValue = parse(expTime)
  const expDate = new Date(modDate.getTime() + expTimeValue)
  return expDate
}
