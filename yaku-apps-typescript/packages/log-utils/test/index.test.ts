// SPDX-FileCopyrightText: 2022 2023 by grow platform GmbH
// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import logUpdate from 'log-update'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { animateLog } from '../src/index'

vi.mock('log-update', () => {
  return {
    default: vi.fn(),
  }
})

describe('animateLog', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.clearAllTimers()
    vi.restoreAllMocks()
  })
  it('logs with spinner at the end', () => {
    animateLog('test')
    vi.advanceTimersToNextTimer()
    expect(logUpdate).toHaveBeenCalledWith('test |')
    vi.advanceTimersToNextTimer()
    expect(logUpdate).toHaveBeenCalledWith('test /')
    vi.advanceTimersToNextTimer()
    expect(logUpdate).toHaveBeenCalledWith('test -')
    vi.advanceTimersToNextTimer()
    expect(logUpdate).toHaveBeenCalledWith('test \\')
  })

  it('returns a function that stops the animation', () => {
    const result = animateLog('test', 150)
    expect(result.stop).toBeDefined()
    result.stop()
    vi.advanceTimersByTime(300)
    expect(logUpdate).toHaveBeenCalledTimes(1)
  })
})
