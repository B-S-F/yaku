// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { Environment } from './handlers/environment.js'

export async function loginToken(
  token: string,
  envName: string,
  url: string,
): Promise<Environment> {
  return {
    name: envName,
    url,
    accessToken: token,
    current: true,
  }
}
