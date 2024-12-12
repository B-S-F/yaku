// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { computed, Ref, ref } from 'vue'
import { useApiFinding, useApiNetworkError } from '~api'
import useKeycloakStore from '~/store/useKeycloakStore'
import { ApiError, NamespaceUser } from '~/api'
import { Finding } from '~/types'
import { storeToRefs } from 'pinia'

const useResolveFinding = (finding: Ref<Finding | undefined>) => {
  const findingApi = useApiFinding()
  const keycloakStore = useKeycloakStore()
  const { user } = storeToRefs(keycloakStore)
  const currentUser = computed(() => user.value?.uuid)
  const error = ref<string>()

  const getResolversName = (resolver: string | NamespaceUser | null) => {
    if (!resolver) return null
    if ((typeof resolver as string) === 'string') return resolver as string

    const namespaceUser = resolver as NamespaceUser
    if (namespaceUser.displayName && namespaceUser.displayName.trim() !== '') {
      return namespaceUser.displayName
    } else if (namespaceUser.username || namespaceUser.id) {
      return namespaceUser.username || namespaceUser.id
    }
    return '-'
  }

  const onResolve = async (resolvedComment: string) => {
    // const userId = accounts.value.at(0)?.idTokenClaims?.oid
    try {
      if (finding.value) {
        const r = await findingApi.updateFinding({
          id: finding.value.id,
          status: 'resolved',
          resolvedComment,
          resolver: currentUser.value,
        })
        if (!r.ok) {
          error.value = ((await r.json()) as ApiError).message
        } else {
          finding.value = (await r.json()) as Finding
          finding.value.resolver = await getResolversName(
            finding.value?.resolver,
          )
        }
      }
    } catch (e) {
      error.value = useApiNetworkError()
    }
  }

  const onUnresolve = async () => {
    try {
      if (finding.value) {
        const r = await findingApi.updateFinding({
          id: finding.value.id,
          status: 'unresolved',
          resolvedDate: null,
          resolvedComment: null,
          resolver: null,
        })
        if (!r.ok) {
          error.value = ((await r.json()) as ApiError).message
        } else {
          finding.value = (await r.json()) as Finding
        }
      }
    } catch (e) {
      error.value = useApiNetworkError()
    }
  }

  return {
    getResolversName,
    onResolve,
    onUnresolve,
  }
}

export default useResolveFinding
