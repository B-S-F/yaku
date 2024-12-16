// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ReleaseComment } from '~/api'
import { useApiNetworkError } from '~/composables/api'
import { useApiReleases } from '~/composables/api/useApiReleases'

const releaseCommentsStore = () => {
  const comments = ref<ReleaseComment[]>([])

  const { getCommentsByReference } = useApiReleases()

  const fetchComments = async (releaseId: number) => {
    try {
      comments.value = []
      const r = await getCommentsByReference({ releaseId, type: 'release' })
      if (r.ok) {
        const res = (await r.json())?.comments as ReleaseComment[]
        comments.value = res
      } else {
        throw new Error((await r.json())?.message)
      }
    } catch (error) {
      throw new Error(useApiNetworkError())
    }
  }

  return { comments, fetchComments }
}

export const useReleaseCommentsStore = defineStore(
  'releaseCommentsStore',
  releaseCommentsStore,
)
