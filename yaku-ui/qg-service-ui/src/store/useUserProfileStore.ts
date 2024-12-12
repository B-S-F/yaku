// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ApiError } from '~/api'
import { UpdateUserProfileParams } from '~/api/userProfile'
import { useApiNetworkError } from '~/composables/api'
import { useApiUserProfile } from '~/composables/api/useApiUserProfile'
import { EditorType } from '~/types'

export type StoreUserProfile = {
  emailNotifications: boolean
  editor: EditorType
}

type onSuccess = () => void
type onErrorCallback = (e: string) => void

const useUserProfile = () => {
  const userProfile = ref<StoreUserProfile>({
    emailNotifications: false,
    editor: 'code',
  })
  const { getUserProfile, updateUserProfile: patchProfile } =
    useApiUserProfile()

  const loadProfile = async (onError?: onErrorCallback) => {
    /** state */
    try {
      const getProfile = await getUserProfile()
      if (getProfile.ok) {
        const data = await getProfile.json()
        if (data) {
          userProfile.value.emailNotifications = data?.emailNotifications
          userProfile.value.editor = data?.editor
        }
      } else {
        const apiError = (await getProfile.json()) as ApiError
        if (apiError && onError) {
          console.error(apiError)
          if (apiError?.message) onError(apiError?.message)
        }
      }
    } catch (error) {
      console.error(error)
      if (onError) onError(useApiNetworkError() as string)
    }
  }

  const updateProfile = async (
    payload: UpdateUserProfileParams,
    onSuccess: onSuccess,
    onError: onErrorCallback,
  ) => {
    try {
      const updateProfile = await patchProfile(payload)
      if (updateProfile.ok) {
        const data = await updateProfile.json()
        if (data) {
          userProfile.value.emailNotifications = data?.emailNotifications
          userProfile.value.editor = data?.editor
          if (onSuccess) onSuccess()
        }
      } else {
        const apiError = (await updateProfile.json()) as ApiError
        if (apiError && onError) {
          console.error(apiError)
          if (apiError?.message) onError(apiError?.message)
        }
      }
    } catch (error) {
      console.error(error)
      if (onError) onError(useApiNetworkError() as string)
    }
  }

  return {
    userProfile,
    loadProfile,
    updateProfile,
  }
}

export default () =>
  defineStore('userProfileStore', useUserProfile, {
    persist: {
      storage: sessionStorage,
    },
  })()
