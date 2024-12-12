// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export type AuthMeResponse = Array<{
  access_token: string
  expires_on: string
  id_token: string
  provider_name: string
  user_claims: Array<{ typ: string; val: string }>
  user_id: string
}>

export type AuthLoginResponse = {
  authenticationToken: string
  user: {
    userId: string
  }
}

export type Token = {
  username: string
  tokenId: string
  iat: number
  exp: number
}
