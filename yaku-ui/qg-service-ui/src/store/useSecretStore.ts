// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { GetSecrets, SecretPost, SecretUpdate } from '~/api'
import type { Secret, SecretMetadata } from '~/types'
import { useApiCore, type StoreContext } from '~api'
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getStoreKey } from '~helpers'
import {
  getApiError,
  getNetworkError,
  type OperationResult,
} from './apiIntegration'
import { ERROR_SECRET_INVALID, ERROR_SECRET_TOO_LONG } from '~/config/secrets'

export type SecretOperationResult = OperationResult<SecretMetadata>
export type SecretsOperationResult = OperationResult<SecretMetadata[]>

const CUSTOM_ERROR_MESSAGES = {
  403: ERROR_SECRET_INVALID,
  413: ERROR_SECRET_TOO_LONG,
}

export const secretStore = () => {
  const apiCore = useApiCore()
  const secrets = ref<SecretMetadata[]>([])

  const _updateAtIndex = (i: number, secretsData: SecretMetadata) => {
    secrets.value[i] = {
      ...secrets.value[i],
      ...secretsData,
    }
  }

  /** handle addition or update of secrets */
  const _addSecrets = (newSecrets: SecretMetadata[]) => {
    const toAdd = newSecrets.reduce((acc, newRun) => {
      const isAtIndex = secrets.value.findIndex((r) => r.name === newRun.name)
      if (isAtIndex === -1) {
        acc.push(newRun)
      } else {
        _updateAtIndex(isAtIndex, newRun)
      }
      return acc
    }, [] as SecretMetadata[])
    secrets.value.push(...toAdd)
  }

  const _removeByName = (name: string) => {
    const i = secrets.value.findIndex((r) => r.name === name)
    return secrets.value.splice(i, 1)[0]
  }

  /**
   * It relies on the etag-Header of the API to refresh the GET request when needed.
   */
  const getSecrets = async (): Promise<SecretsOperationResult> => {
    try {
      const r = await apiCore.getSecrets({ pagination: { items: '100' } })
      if (r.ok) {
        const { data: secrets } = (await r.json()) as GetSecrets
        _addSecrets(secrets)
        return { ok: true, resource: secrets }
      } else {
        return getApiError(r)
      }
    } catch (e) {
      return getNetworkError(e)
    }
  }

  const createSecret = async (
    secret: SecretPost,
  ): Promise<SecretOperationResult> => {
    try {
      const r = await apiCore.postSecret(secret)
      if (r.ok) {
        const secret = (await r.json()) as Secret
        _addSecrets([secret])
        return { ok: true, resource: secret }
      } else {
        return await getApiError(r, { customErrMsg: CUSTOM_ERROR_MESSAGES })
      }
    } catch (e) {
      return getNetworkError(e)
    }
  }

  const updateSecret = async (
    updatedSecret: SecretUpdate,
    currentSecret: Pick<SecretMetadata, 'name'>,
  ): Promise<SecretOperationResult> => {
    const isNameUntouched = updatedSecret.name === currentSecret.name
    const secretPayload = Object.hasOwn(updatedSecret, 'secret')
      ? (updatedSecret as SecretPost)
      : { name: updatedSecret.name, description: updatedSecret.description }

    try {
      if (isNameUntouched) {
        const r = await apiCore.patchSecret(secretPayload)
        if (r.ok) {
          const updatedSecret = (await r.json()) as SecretMetadata
          const atIndex = secrets.value.findIndex(
            (s) => s.name === currentSecret.name,
          )
          _updateAtIndex(atIndex, updatedSecret)
          return { ok: true, resource: updatedSecret }
        } else {
          return getApiError(r, { customErrMsg: CUSTOM_ERROR_MESSAGES })
        }
      } else {
        // the name is modified, so we create a new secret from the new name
        // and delete the one with the old name.
        const r = await createSecret(secretPayload as SecretPost)
        if (!r.ok) return r
        const secretNameToDelete = currentSecret.name
        return deleteSecret(secretNameToDelete)
      }
    } catch (e) {
      return getNetworkError(e)
    }
  }

  const deleteSecret = async (
    name: Secret['name'],
  ): Promise<SecretOperationResult> => {
    try {
      const r = await apiCore.deleteSecret(name)
      if (r.ok) {
        const secret = _removeByName(name)
        return { ok: true, resource: secret }
      } else {
        return await getApiError(r)
      }
    } catch (e) {
      return getNetworkError(e)
    }
  }

  return {
    secrets,
    getSecrets,
    createSecret,
    updateSecret,
    deleteSecret,
    updateAtIndex: _updateAtIndex,
  }
}

export const useSecretStore = (params: StoreContext) =>
  defineStore(getStoreKey('secret', params), secretStore, {
    persist: {
      storage: sessionStorage,
    },
  })()
