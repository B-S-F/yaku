// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import {
  type PublicClientApplication,
  type AuthenticationResult,
  EventType,
} from '@azure/msal-browser'

export const initMsalAccount = async (
  msalInstance: PublicClientApplication,
) => {
  await msalInstance.initialize()

  // set the msal active account
  const accounts = msalInstance.getAllAccounts()
  if (accounts.length > 0) {
    msalInstance.setActiveAccount(accounts[0])
  }

  // if no account is provided, it redirects to the azure login page with the useMsalAuthentication
  msalInstance.addEventCallback((event) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
      const payload = event.payload as AuthenticationResult
      const account = payload.account
      msalInstance.setActiveAccount(account)
    }
  })
}
