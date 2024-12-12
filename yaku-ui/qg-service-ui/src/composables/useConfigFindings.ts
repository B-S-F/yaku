// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { ref } from 'vue'
import { GetFindings } from '~/api'
import { provideRequestError } from '~/helpers'
import { Finding } from '~/types'
import { useApiFinding, useApiNetworkError } from './api'

const createUseConfigFindings = () => {
  const findings = ref<Finding[]>()
  const findingsAmount = ref<number>()
  const apiError = ref<string>()
  const { getFindings } = useApiFinding()

  const getFindingsCount = async (configId: string, hideResolved = false) => {
    const r = await getFindings({
      pagination: { items: '1' },
      filters: { configId, hideResolved },
    })
    if (!r.ok) return // stop initialization on request failure
    const { pagination } = (await r.json()) as GetFindings
    findingsAmount.value = pagination?.totalCount ?? 0
  }
  const fetchAllFindings = async (configId: string, hideResolved?: boolean) => {
    let page: number | undefined = 1
    while (page !== undefined) {
      try {
        const r = await getFindings({
          pagination: { items: '100', page: page.toString() },
          filters: { configId, hideResolved },
        })
        if (r.ok) {
          const { data, links } = (await r.json()) as GetFindings
          if (!findings.value) findings.value = []
          findings.value.push(...data)
          page = links.next ? page + 1 : undefined
        } else {
          apiError.value = await provideRequestError(r)
          page = undefined
        }
      } catch (e) {
        apiError.value = useApiNetworkError()
        page = undefined
      }
    }
  }

  const updateFinding = (finding: Finding) => {
    if (!findings.value || !findings.value.length) return
    const getFindingIdx = findings.value.findIndex((f) => f.id === finding.id)
    if (getFindingIdx === -1) return
    findings.value[getFindingIdx] = finding
  }

  return {
    findings,
    findingsAmount,
    getFindingsCount,
    fetchAllFindings,
    updateFinding,
  }
}

const useConfigFindings = () => {
  return createUseConfigFindings()
}

export default useConfigFindings
