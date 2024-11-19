// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest'
import { configureProxyTunnel } from '../../../src/utils/configure-proxy-tunnel'

describe('configureProxyTunnel', async () => {
  it('should return a agent config for https', () => {
    expect(
      configureProxyTunnel('https', 'https://proxy', 'http://proxy')
    ).toBeDefined()
  })
  it('should return a agent config for http', () => {
    expect(
      configureProxyTunnel('http', 'https://proxy', 'http://proxy')
    ).toBeDefined()
  })
  it('should return undefined if no protocol is provided', () => {
    expect(configureProxyTunnel('', 'https://proxy', 'http://proxy')).toEqual(
      undefined
    )
  })
  it('should return undefined for https if no https_proxy is provided', () => {
    expect(configureProxyTunnel('https', undefined, undefined)).toEqual(
      undefined
    )
  })
  it('should return undefined for http if no http_proxy is provided', () => {
    expect(configureProxyTunnel('http', undefined, undefined)).toEqual(
      undefined
    )
  })
  it('should return undefined if no proxy is provided', () => {
    expect(
      configureProxyTunnel('https', 'https://proxy', 'http://proxy')
    ).toBeDefined()
  })
})
