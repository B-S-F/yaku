// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { Config } from '~/types'
import { useLocalStorage } from '@vueuse/core'
import { computed } from 'vue'
import { getStoreKey } from '~helpers'
import { useConfigStore } from '~/store/useConfigStore'
import { storeContext } from './api'

type BrowseHistoryItem = { configId: Config['id'] }

const HISTORY_SIZE = 5
const STORAGE_SIZE = 8

/**
 * Manipulate the browser history and bring it in scope of components.
 *
 * It pushes new history item at the top of the stack and remove the old one exceeding the HISTORY_SIZE.
 * The history is updated in the following views:
 * * Configuration Editor
 * * Run Results
 * * Finding Detail
 */
export const useYakuBrowseHistory = () => {
  const storageKey = getStoreKey('last-configuration', storeContext)
  const configStore = useConfigStore(storeContext)

  /**
   * A small extendable user browsing history.
   * It stores the configuration related to the resource consulted.
   */
  const history = useLocalStorage<BrowseHistoryItem[]>(storageKey, [])
  /**
   * A cleaned browser history exposing only the expected amount of item.
   */
  const usableHistory = computed(() =>
    history.value
      .filter((v) => configStore.configs.find((c) => c.id === v.configId))
      .slice(0, HISTORY_SIZE),
  )

  type Item = {
    configId: number
  }
  const push = (item: Item) => {
    // remove a similar entry if one exists
    const existAtIndex = history.value.findIndex(
      (el) => el.configId === item.configId,
    )
    if (existAtIndex !== -1) {
      history.value.splice(existAtIndex, 1)
    }
    // add the new entry at the start of the array
    history.value.unshift(item)
    // keep the history to a specific lenth
    history.value.splice(STORAGE_SIZE)
  }

  return {
    history: usableHistory,
    push,
  }
}
