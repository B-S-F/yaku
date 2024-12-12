// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { computed } from 'vue'
import { currentEnv } from './context'
import { useAuthHeaders } from './useAuthHeaders'
import { UpdateUserProfileParams } from '~/api/userProfile'

export const useApiUserProfile = () => {
  const { getAuthHeader } = useAuthHeaders()
  const endpointURL = computed(
    () => `${currentEnv.value?.url}/api/v1/user-profile`,
  )

  /**
   * Get User Profile
   * @return Promise<Response>
   */
  const getUserProfile = async (): Promise<Response> =>
    await fetch(endpointURL.value, {
      headers: getAuthHeader(),
    })

  /**
   * Update User Profile
   * @param UpdateUserProfileParams
   * @returns Promise<Response>
   */
  const updateUserProfile = async (payload: UpdateUserProfileParams) =>
    await fetch(endpointURL.value, {
      method: 'PATCH',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

  return {
    getUserProfile,
    updateUserProfile,
  }
}
