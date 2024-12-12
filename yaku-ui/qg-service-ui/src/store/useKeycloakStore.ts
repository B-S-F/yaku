// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import Keycloak from 'keycloak-js'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { keycloakService } from '~/auth/KeycloakService'

export type KeycloakStoreUser = {
  email?: string
  lastName?: string // idParsed.family_name
  firstName?: string // idParsed.given_name
  name?: string // idParsed.name
  username?: string // idParsed.preferred_username
  uuid?: string
}

const keycloakStore = () => {
  const authenticated = ref<boolean>(false)
  const user = ref<KeycloakStoreUser>({})
  const token = ref<string>()

  const load = async (keycloak: Keycloak | null) => {
    authenticated.value = !!keycloak?.authenticated
    user.value.email = keycloak?.idTokenParsed?.email
    user.value.firstName = keycloak?.idTokenParsed?.given_name
    user.value.lastName = keycloak?.idTokenParsed?.family_name
    user.value.name = keycloak?.idTokenParsed?.name
    user.value.username = keycloak?.idTokenParsed?.preferred_username
    user.value.uuid = keycloak?.idTokenParsed?.sub
    token.value = keycloak?.token
  }

  // const logout: () => Promise<void> = async () => await kcLogout()
  const logout: () => Promise<void> = async () => {
    const keycloakInstance = keycloakService.getKeycloakInstance()
    if (keycloakInstance) {
      return await keycloakInstance?.logout({
        redirectUri: window.location.origin,
      })
    }
  }

  const updateToken = async (callback: () => void) => {
    const keycloakInstance = keycloakService.getKeycloakInstance()
    try {
      if (keycloakInstance) {
        const refreshed = await keycloakInstance.updateToken(5)
        if (refreshed) {
          callback()
        }
      }
    } catch (error) {
      console.error('Keycloak error updating token', error)
    }
  }

  return {
    user,
    token,
    authenticated,
    load,
    logout,
    updateToken,
  }
}

export default () =>
  defineStore('keycloak-store', keycloakStore, {
    persist: {
      storage: localStorage,
    },
  })()
