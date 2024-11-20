// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { YakuClientConfig } from './types'

export default class ClientConfig {
  static config: YakuClientConfig

  public static getConfig(): YakuClientConfig | null {
    if (!ClientConfig.config) {
      return null
    }
    return ClientConfig.config
  }

  public static setConfig(config: YakuClientConfig): void {
    ClientConfig.config = config
  }
}
