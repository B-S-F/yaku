// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { ref } from 'vue'
import { useMsal } from './useMsal'
import {
  AuthenticationResult,
  EventMessage,
  EventType,
} from '@azure/msal-browser'

const idToken = ref<string>()
const accessToken = ref<string>()
const isUpdateCallbackBound = ref(false)

export const useMsalTokens = () => {
  const { instance } = useMsal()

  const updateTokens = (p: AuthenticationResult) => {
    if (p.idToken) {
      idToken.value = p.idToken
    }
    if (p.accessToken) {
      accessToken.value = p.accessToken
    }
  }

  /**
   * Should be called on msal events in order to update the tokens on specific events
   */
  const onMsalEvent = ({ eventType, payload }: EventMessage) => {
    if (
      eventType === EventType.ACQUIRE_TOKEN_SUCCESS ||
      eventType === EventType.LOGIN_SUCCESS ||
      eventType === EventType.SSO_SILENT_SUCCESS
    ) {
      updateTokens(payload as AuthenticationResult)
    }
  }

  // set only one addEventCallback
  if (!isUpdateCallbackBound.value) {
    isUpdateCallbackBound.value = true
    instance.addEventCallback(onMsalEvent)
  }

  return {
    idToken,
    accessToken,
  }
}
