// SPDX-FileCopyrightText: 2022 2023 by grow platform GmbH
// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { Status } from '@B-S-F/autopilot-utils'
import parse from 'parse-duration'

export const validateExpDate = (expirationDate: Date): Status => {
  const date = new Date()
  // Check if expiration date is in the past
  if (date >= expirationDate) {
    return 'RED'
  }

  const diff = expirationDate.getTime() - date.getTime()

  // parse expiryReminderTime
  const expiryReminderTime = process.env.expiry_reminder_period
    ? parse(process.env.expiry_reminder_period)
    : parse('14d')

  // Check if the Status is within the expiry reminder period
  if (diff <= expiryReminderTime) {
    return 'YELLOW'
  } else {
    return 'GREEN'
  }
}
