/**
 * Copyright (c) 2022, 2023 by grow platform GmbH
 */

import logUpdate from 'log-update'

const animation = '|/-\\'

/**
 * Prints out `text` to the console and appends an animated spinner to the end.
 *
 * Uses the `log-update` package. Calling `stop()` on the returned object will only
 * stop the animation but not close the current log-update session, so it can be reused
 * and has to be closed with `logUpdate.done()` separately.
 *
 * @param {*} text to print, can be of any type that can be represented as string
 * @param {*} interval as number in ms to call the setInterval method with
 * @returns an object with a `stop()` function to stop the animation
 */
export function animateLog(text: any, interval = 150) {
  let animationIndex = 0
  const intervalId = setInterval(() => {
    logUpdate(`${text} ${animation[animationIndex]}`)
    animationIndex = (animationIndex + 1) % animation.length
  }, interval)

  return {
    stop(overwrite?: boolean) {
      clearInterval(intervalId)
      logUpdate(text)
      if (overwrite) logUpdate.clear()
    },
  }
}
