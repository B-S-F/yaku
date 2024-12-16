// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import {
  AccountInfo,
  InteractionStatus,
  PublicClientApplication,
} from '@azure/msal-browser'
import { getCurrentInstance, Ref, toRefs } from 'vue'

export type MsalContext = {
  instance: PublicClientApplication
  accounts: Ref<AccountInfo[]>
  inProgress: Ref<InteractionStatus>
}

/**
 *
 * composable from https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/samples/msal-browser-samples/vue3-sample-app/src/composition-api/useMsal.ts
 * @returns
 */
export function useMsal(): MsalContext {
  const internalInstance = getCurrentInstance()
  if (!internalInstance) {
    throw 'useMsal() cannot be called outside the setup() function of a component'
  }
  const { instance, accounts, inProgress } = toRefs(
    internalInstance.appContext.config.globalProperties.$msal,
  )

  if (!instance.value || !accounts.value || !inProgress.value) {
    throw 'Please install the msalPlugin'
  }

  return {
    instance: instance.value,
    accounts,
    inProgress,
  }
}
