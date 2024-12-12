// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { ref } from 'vue'
import { useApiReleases } from '../api/useApiReleases'
import { ReleaseApprover } from '~/types/Release'
import { ReleaseComment } from '~/api'
import { convertRunResultToReport } from '~/helpers'
import { storeContext } from '../api'
import { useReportStore } from '~/store/useReportStore'
import { useReleaseStore } from '~/store/useReleaseStore'
import useKeycloakStore from '~/store/useKeycloakStore'
import { storeToRefs } from 'pinia'
import { ReleaseSubscription } from '~/api/release/subscription'

export const useReleaseFetcher = ({ id }: { id: number | string }) => {
  const reportStore = useReportStore(storeContext)
  const releaseStore = useReleaseStore(storeContext)
  const releaseStatus = ref<string>('')
  const releaseApprovers = ref<ReleaseApprover[]>([])
  const releaseComments = ref<ReleaseComment[]>([])
  const releaseRunReport =
    ref<NonNullable<ReturnType<typeof convertRunResultToReport>>['report']>()
  const releaseSubscription = ref<ReleaseSubscription | null>()

  const {
    getApprovalState,
    getApprovalStateAll,
    getCommentsByReference,
    getReleaseSubscription,
  } = useApiReleases()

  const keycloakStore = useKeycloakStore()
  const userInfo = storeToRefs(keycloakStore)?.user?.value

  const fetchReleaseApprovalState = async () => {
    const r = await getApprovalState({ releaseId: id as number })
    if (r.ok) {
      const state = (await r.json())?.state as string
      releaseStatus.value = state
    }
  }

  const fetchAllApproversState = async () => {
    const r = await getApprovalStateAll({ releaseId: id as number })
    if (r.ok) {
      const state = await r.json()
      releaseApprovers.value = state?.data.map((user: ReleaseApprover) => {
        if (user && typeof user.user === 'string') {
          return {
            ...user,
            user: {
              displayName: user.user,
              id: user.id,
              username: user.user,
            },
          }
        } else return user
      })
    } else {
      // TODO: Error handling for this requests
    }
  }

  const fetchReleaseComments = async () => {
    const r = await getCommentsByReference({
      releaseId: id as number,
      type: 'release',
    })
    if (r.ok) {
      const comments = (await r.json())?.comments as ReleaseComment[]
      releaseComments.value = comments
    }
  }

  const getReleaseRunReport = async () => {
    const lastRun = releaseStore.getById(Number(id))?.lastRunId
    if (lastRun) {
      const { ok, resource } = await reportStore.getReport(lastRun)
      if (ok) {
        const runReport = convertRunResultToReport(resource)
        if (!runReport) return // TODO: the run report format is not support yet
        releaseRunReport.value = runReport.report
      }
    }
  }

  const checkReleaseSubscription = async () => {
    try {
      if (!userInfo.uuid) return
      const r = await getReleaseSubscription({
        userId: userInfo.uuid,
        releaseId: Number(id),
      })
      if (!r.ok) return
      if (
        r.headers.get('content-length') &&
        r.headers.get('content-type')?.includes('application/json')
      ) {
        releaseSubscription.value = await r.json()
      } else {
        releaseSubscription.value = undefined
      }
    } catch (error) {
      console.error('Release subscription: ', { error })
    }
  }
  const fetchReleaseData = async () => {
    await fetchReleaseApprovalState()
    await fetchAllApproversState()
    await checkReleaseSubscription()
  }
  return {
    releaseStatus,
    releaseApprovers,
    releaseComments,
    releaseRunReport,
    fetchReleaseApprovalState,
    fetchAllApproversState,
    fetchReleaseComments,
    fetchReleaseData,
    getReleaseRunReport,
    releaseSubscription,
    checkReleaseSubscription,
  }
}
