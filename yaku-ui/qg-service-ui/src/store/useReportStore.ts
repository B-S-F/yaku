// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { RunResult } from '~/types/RunResult'
import type { StoreContext } from '~api'
import {
  getApiError,
  getNetworkError,
  type OperationResult,
} from './apiIntegration'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { load } from 'js-yaml'
import { useApiCore } from '~api'
import { getStoreKey } from '~helpers'

type ReportOperationResult = OperationResult<RunResult>

const runResultStore = () => {
  const reports = ref<{ id: number; report: RunResult }[]>([])

  const api = useApiCore()

  const getReport = async (runId: number): Promise<ReportOperationResult> => {
    const reportCandidate = reports.value.find((r) => r.id === runId)
    if (reportCandidate) return { ok: true, resource: reportCandidate.report }
    try {
      const r = await api.getRunResults({ runId })
      if (!r.ok) return getApiError(r)
      const report = load(await r.text()) as RunResult
      reports.value.push({ id: runId, report })
      return { ok: true, resource: report }
    } catch (e) {
      return getNetworkError(e)
    }
  }

  return { reports, getReport }
}

export const useReportStore = (params: StoreContext) =>
  defineStore(getStoreKey('report', params), runResultStore, {
    persist: {
      storage: sessionStorage,
    },
  })()
