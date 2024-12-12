// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { NamespaceUser } from '~/api'
import { useApiCore, useApiNetworkError } from '~/composables/api'

const useNamespaceUsersStore = () => {
  const users = ref<NamespaceUser[]>([])
  const fetchNamespaceUsersError = ref<string>()
  const apiCore = useApiCore()

  const fetchUsers = async () => {
    try {
      const fetchUsers = await apiCore.getNamespaceUsers()
      if (fetchUsers.ok) {
        const json = await fetchUsers.json()
        users.value = json?.data
      } else {
        fetchNamespaceUsersError.value = (await fetchUsers.json())?.message
      }
    } catch (error) {
      console.error('Error fetching namespace users: ', error)
      fetchNamespaceUsersError.value = useApiNetworkError()
    }
  }

  return {
    users,
    fetchNamespaceUsersError,
    fetchUsers,
  }
}

export default () =>
  defineStore('namespace-users-store', useNamespaceUsersStore)()
