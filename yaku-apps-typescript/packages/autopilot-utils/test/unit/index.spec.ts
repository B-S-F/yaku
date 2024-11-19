// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { describe, it, expect, vi } from 'vitest'
import { AppOutput } from '../../src'

// mock console

describe('app-interface', () => {
  it('should create an instance of AppInterface', () => {
    const appInterface = new AppOutput()
    expect(appInterface).toBeInstanceOf(AppOutput)
  })

  it('should not output status if no status is set', () => {
    const consoleSpy = vi.spyOn(console, 'log')
    const appInterface = new AppOutput()
    appInterface.setReason('The app did not set a status.')
    appInterface.write()
    expect(consoleSpy).toHaveBeenCalledWith(
      JSON.stringify({
        reason: 'The app did not set a status.',
      })
    )
  })

  it('should not output reason if no reason is set', () => {
    const consoleSpy = vi.spyOn(console, 'log')
    const appInterface = new AppOutput()
    appInterface.setStatus('GREEN')
    appInterface.write()
    expect(consoleSpy).toHaveBeenCalledWith(
      JSON.stringify({
        status: 'GREEN',
      })
    )
  })

  it('should serve happy path', () => {
    const consoleSpy = vi.spyOn(console, 'log')
    const appInterface = new AppOutput()
    appInterface.setStatus('GREEN')
    appInterface.setReason('Everything is fine.')
    appInterface.addOutput({ foo: 'bar' })
    appInterface.addResult({
      criterion: 'foo',
      justification: 'bar',
      fulfilled: true,
    })
    appInterface.write()
    expect(consoleSpy).toHaveBeenCalledWith(
      JSON.stringify({ output: { foo: 'bar' } })
    )
    expect(consoleSpy).toHaveBeenCalledWith(
      JSON.stringify({
        result: {
          criterion: 'foo',
          justification: 'bar',
          fulfilled: true,
        },
      })
    )
    expect(consoleSpy).toHaveBeenCalledWith(
      JSON.stringify({ status: 'GREEN', reason: 'Everything is fine.' })
    )
  })

  it('should print results in multiple json lines', () => {
    const consoleSpy = vi.spyOn(console, 'log')
    const appInterface = new AppOutput()
    appInterface.addResult({
      criterion: 'foo',
      justification: 'bar',
      fulfilled: true,
    })
    appInterface.addResult({
      criterion: 'foo2',
      justification: 'bar2',
      fulfilled: false,
    })
    appInterface.addResult({
      criterion: 'foo3',
      justification: 'bar3',
      fulfilled: true,
    })
    appInterface.write()
    expect(consoleSpy).toHaveBeenCalledWith(
      JSON.stringify({
        result: {
          criterion: 'foo',
          justification: 'bar',
          fulfilled: true,
        },
      })
    )
    expect(consoleSpy).toHaveBeenCalledWith(
      JSON.stringify({
        result: {
          criterion: 'foo2',
          justification: 'bar2',
          fulfilled: false,
        },
      })
    )
    expect(consoleSpy).toHaveBeenCalledWith(
      JSON.stringify({
        result: {
          criterion: 'foo3',
          justification: 'bar3',
          fulfilled: true,
        },
      })
    )
  })

  it('should print outputs in multiple json lines', () => {
    const consoleSpy = vi.spyOn(console, 'log')
    const appInterface = new AppOutput()
    appInterface.addOutput({ foo: 'bar' })
    appInterface.addOutput({ foo2: 'bar2' })
    appInterface.addOutput({ foo3: 'bar3' })
    appInterface.write()
    expect(consoleSpy).toHaveBeenCalledWith(
      JSON.stringify({ output: { foo: 'bar' } })
    )
    expect(consoleSpy).toHaveBeenCalledWith(
      JSON.stringify({ output: { foo2: 'bar2' } })
    )
    expect(consoleSpy).toHaveBeenCalledWith(
      JSON.stringify({ output: { foo3: 'bar3' } })
    )
  })
})
