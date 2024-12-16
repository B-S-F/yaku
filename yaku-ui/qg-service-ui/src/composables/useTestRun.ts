// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { Run, RunState, RunUnaccomplished, TestRun } from '~/types'
import type { SingleCheck } from '~/api'
import { ref, reactive, computed } from 'vue'
import { storeContext, useApiCore } from './api'
import { useRunStore } from '~/store/useRunStore'

type TestRunContext = {
  id: Run['id']
  check: { name: string }
  context: SingleCheck
}

export const useTestRun = () => {
  const runStore = useRunStore(storeContext)
  const apiCore = useApiCore()

  const show = ref(false)
  const testRunContext = ref<[TestRunContext] | []>([])
  const runs = computed<[TestRun] | []>(() => {
    const runContext = testRunContext.value.at(0)
    if (!runContext) return []
    const { id, context, check } = runContext
    const run = runStore.runs.find((r) => r.id === id)
    return run ? [toTestRun(run, { context, name: check.name })] : []
  })
  const isRunning = computed(() =>
    runs.value.some((r) => r.status === 'running' || r.status === 'pending'),
  )

  /** a util converter to provide a unified API between the Yaku Run and Test Run (a UI only entity) */
  const toTestRun = (run: Run, check: TestRun['check']): TestRun => {
    // create a new object to ensure type-safety with typescript
    const runState = {
      status: run.status,
      overallResult: run.overallResult,
    } as RunState
    return {
      ...runState,
      id: run.id,
      log: run.log,
      creationTime: run.creationTime,
      completionTime: run.completionTime,
      check,
    }
  }

  const start = (
    configId: number,
    check: { name: string },
    singleCheck: SingleCheck,
  ) => {
    // do not register it in the run stores as there are two different entities
    apiCore
      .postRunCheck({ configId, singleCheck })
      .then(async (r) => {
        if (!r.ok) {
          console.error(await r.json())
        } else {
          const run = (await r.json()) as RunUnaccomplished
          // save the run context to reuse it in the runs computed property
          testRunContext.value = [
            {
              id: run.id,
              context: singleCheck,
              check: { name: check.name },
            },
          ]
          // register the test run in the store to trigger the refresh logic
          runStore.push([run])
          show.value = true
        }
      })
      .catch(console.error)
  }

  return reactive({
    show,
    runs,
    isRunning,
    start,
  })
}
