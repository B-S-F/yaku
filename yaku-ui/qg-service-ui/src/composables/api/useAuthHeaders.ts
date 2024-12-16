// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { storeToRefs } from 'pinia'
import useKeycloakStore from '~/store/useKeycloakStore'

export const useAuthHeaders = () => {
  const keycloakStore = useKeycloakStore()
  const { token: storedToken } = storeToRefs(keycloakStore)

  const getAuthHeader = (token?: string) => ({
    Authorization: `Bearer ${token ?? storedToken.value}`,
  })

  return {
    getAuthHeader,
  }
}
