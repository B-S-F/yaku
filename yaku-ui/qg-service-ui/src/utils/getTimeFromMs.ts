// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

const SECOND_IN_MINUTES = 60

export const getTimeFromMs = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / SECOND_IN_MINUTES)
  const seconds = totalSeconds % SECOND_IN_MINUTES // the remaining seconds that are not in a minute

  return {
    minutes,
    seconds,
  }
}
