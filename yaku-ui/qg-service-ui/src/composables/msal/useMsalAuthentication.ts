// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import {
  AuthenticationResult,
  AuthError,
  EventType,
  InteractionStatus,
  InteractionType,
  PopupRequest,
  RedirectRequest,
  SilentRequest,
} from '@azure/msal-browser'
import { Ref, ref, watch } from 'vue'
import { REDIRECT_URL_KEY } from '~/config/msal'
import { useMsal } from './useMsal'

export type MsalAuthenticationResult = {
  acquireToken: (
    callbackInteractionType?: InteractionType | undefined,
    callbackRequest?: SilentRequest | undefined,
  ) => Promise<AuthenticationResult | null>
  result: Ref<AuthenticationResult | null>
  error: Ref<AuthError | null>
  inProgress: Ref<boolean>
}

const FIVE_MINUTES_MS = 5 * 60 * 1000
const isInitializedOnce = ref(false)

/**
 * Official vue example of msal browsers https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/samples/msal-browser-samples/vue3-sample-app/src/composition-api/useMsalAuthentication.ts
 * It uses a custom logic to handle the session at the end of the composable though.
 */
export function useMsalAuthentication(
  interactionType: InteractionType,
  request: PopupRequest | RedirectRequest | SilentRequest,
): MsalAuthenticationResult {
  const { instance, inProgress } = useMsal()

  const localInProgress = ref<boolean>(false)
  const result = ref<AuthenticationResult | null>(null)
  const error = ref<AuthError | null>(null)

  const acquireToken = async (
    requestOverride?: PopupRequest | RedirectRequest | SilentRequest,
  ) => {
    if (!localInProgress.value) {
      localInProgress.value = true
      const tokenRequest = requestOverride || request

      if (
        inProgress.value === InteractionStatus.Startup ||
        inProgress.value === InteractionStatus.HandleRedirect
      ) {
        try {
          const response = await instance.handleRedirectPromise()
          if (response) {
            result.value = response
            error.value = null
            return
          }
        } catch (e) {
          result.value = null
          error.value = e as AuthError
          return
        }
      }

      try {
        const response = await instance.acquireTokenSilent(tokenRequest)
        result.value = response
        error.value = null
      } catch (e) {
        if (inProgress.value !== InteractionStatus.None) {
          return
        }

        if (interactionType === InteractionType.Popup) {
          instance
            .loginPopup(tokenRequest)
            .then((response) => {
              result.value = response
              error.value = null
            })
            .catch((e) => {
              error.value = e
              result.value = null
            })
        } else if (interactionType === InteractionType.Redirect) {
          await instance.loginRedirect(tokenRequest).catch((e) => {
            error.value = e
            result.value = null
          })
        }
      }
      localInProgress.value = false
    }
  }

  const stopWatcher = watch(inProgress, () => {
    if (!result.value && !error.value) {
      acquireToken()
    } else {
      stopWatcher()
    }
  })

  acquireToken()

  if (!isInitializedOnce.value) {
    instance.addEventCallback(async (event) => {
      if (event.eventType === EventType.HANDLE_REDIRECT_START) {
        /** Set the target router path that will be loaded after login */
        sessionStorage.setItem(
          REDIRECT_URL_KEY,
          window.location.hash + window.location.search,
        )
      }
    })

    /** acquire new tokens if one is about to expire. */
    watch(result, (newResult) => {
      // follow the TokenClaims type of https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/60c4aafa5/lib/msal-common/src/account/TokenClaims.ts#L9
      const idTokenClaims = newResult?.idTokenClaims
      if (!idTokenClaims) return
      const { exp } = idTokenClaims as { exp?: number }
      if (!exp) return
      const expirationMs = exp * 1000
      const expiresInMs = expirationMs - new Date().getTime()
      // set an update callback when the token is about to expire. This will trigger the watcher again.
      setTimeout(async () => {
        try {
          result.value = await instance.ssoSilent(request)
          error.value = null
        } catch (e) {
          // TODO: handle AADSTS50058: A silent sign-in request was sent but no user is signed in. The cookies used to represent the user's session were not sent in the request to Azure AD.
          // This error occurs in browsers blocking third party cookies (Firefox and Safari as I am aware of.)
          // How should the session be extended in this case? How the user experence flow can be defined in such a way it does not break the current user actions? Login redirect, Popup after a notification hint?
          const msalError = e as AuthError
          result.value = null
          error.value = msalError
          return
        }
      }, expiresInMs - FIVE_MINUTES_MS)
    })
    isInitializedOnce.value = true
  }

  if (import.meta.env.MODE === 'dev:mock') {
    /** Deactivate this error in development with mocks */
    watch(error, (newVal) => {
      if (!newVal) return
      const { errorCode } = newVal
      if (
        errorCode === 'nonce_mismatch' ||
        errorCode === 'login_required' ||
        errorCode === 'monitor_window_timeout' ||
        errorCode === 'invalid_state'
      ) {
        error.value = null
      }
    })
  }

  return {
    acquireToken,
    result,
    error,
    inProgress: localInProgress,
  }
}
