// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type {
  PopupRequest,
  RedirectRequest,
  SilentRequest,
} from '@azure/msal-browser'
// import { LogLevel, PublicClientApplication } from '@azure/msal-browser'

// const errEnvOnUndefined = (env: ImportMetaEnv, name: keyof ImportMetaEnv) => {
//   const value = env[name]
//   if (!value) console.error(`The env ${name} has an incorrect value "${value}"`)
//   return value
// }

// Config object to be passed to Msal on creation
// export const msalConfig = {
//   auth: {
//     clientId: errEnvOnUndefined(import.meta.env, 'VITE_MSAL_CLIENTID'),
//     authority: errEnvOnUndefined(import.meta.env, 'VITE_MSAL_AUTHORITY'),
//     redirectUri: '/', // Must be registered as a SPA redirectURI on your app registration
//     postLogoutRedirectUri: '/' // Must be registered as a SPA redirectURI on your app registration
//   },
//   cache: {
//     cacheLocation: 'localStorage'
//   },
//   system: {
//     loggerOptions: {
//       loggerCallback: (level: LogLevel, message: string, containsPii: boolean) => {
//         if (containsPii) {
//           return
//         }
//         switch (level) {
//           case LogLevel.Error:
//             console.error(message)
//             return
//           case LogLevel.Info:
//             console.info(message)
//             return
//           case LogLevel.Verbose:
//             console.debug(message)
//             return
//           case LogLevel.Warning:
//             console.warn(message)
//             return
//           default:
//             return
//         }
//       },
//       logLevel: LogLevel.Verbose
//     }
//   }
// } satisfies Configuration

// export const msalInstance = new PublicClientApplication(msalConfig)

/**
 * Key used in storage to redirect after a successful login.
 */
export const REDIRECT_URL_KEY = 'redirectAfterLogin'

// Add here scopes for id token to be used at MS Identity Platform endpoints.
export const loginRequest: PopupRequest | RedirectRequest | SilentRequest = {
  scopes: ['user.read', 'openid', 'profile', 'offline_access'], // use the same scopes as https://login.microsoftonline.com/<tenantId>/oauth2/v2.0/token
}
