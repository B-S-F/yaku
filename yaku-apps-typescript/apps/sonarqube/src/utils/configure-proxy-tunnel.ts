/**
 * Copyright (c) 2022, 2023 by grow platform GmbH
 */

import * as tunnel from 'tunnel'

export function configureProxyTunnel(
  protocol: string,
  httpsProxy: string | undefined,
  httpProxy: string | undefined
) {
  let proxy

  if (protocol === 'https') {
    if (httpsProxy) {
      proxy = {
        host: `${httpsProxy.split(':')[1]}`.replace(/^\/\//, ''),
        port: +httpsProxy.split(':')[2],
      }
    }
  } else if (protocol === 'http') {
    if (httpProxy) {
      proxy = {
        host: `${httpProxy.split(':')[1]}`.replace(/^\/\//, ''),
        port: +httpProxy.split(':')[2],
      }
    }
  }

  if (!proxy) return undefined

  return tunnel.httpsOverHttp({
    proxy: proxy,
  })
}
