// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { Run } from '~/types'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useUrlContext } from '~/composables'
import { ROUTE_NAMES } from '~/router'
import useUserProfileStore from '~/store/useUserProfileStore'
import { storeToRefs } from 'pinia'

type Breadcrumb = {
  name: string
  to?: {
    name: string
    params: {
      id: string | null | undefined
    }
    query?: {
      configId?: string
      runId?: string | null
      editor?: string
    }
  }
  hide?: boolean
}

export interface RelationStore {
  items: {
    configuration?: Breadcrumb
    runs?: Breadcrumb
    findings?: Breadcrumb
  }
  runId: Run['id'] | undefined
}

/**
 * A smarter type than the generic setRelation.
 * It allows the developer to provide less redundant information.
 */
export type SmartRelation = {
  configuration: {
    name: string
    id: string
  }
  run: {
    id: string | null
  }
  findings: {
    label?: string
    /** overwrite the default findings route */
    to?: Breadcrumb['to']
  }
}

const runRelationStore = () => {
  const runId = ref<Run['id'] | undefined>()
  const relation = ref<RelationStore>()
  const { urlContext } = useUrlContext()
  const userProfileStore = useUserProfileStore()
  const profile = storeToRefs(userProfileStore).userProfile

  /**
   * An easier to use setRelation function.
   * The main goal is to force strong type safety with the parameter passed.
   */
  const setSmartRelation = ({
    configuration,
    run,
    findings,
  }: SmartRelation) => {
    relation.value = {
      items: {
        configuration: {
          name: configuration.name,
          to: {
            name: ROUTE_NAMES.CONFIG_EDIT,
            params: { ...urlContext.value, id: configuration.id },
            query: { editor: profile.value.editor },
          },
        },
        runs: {
          name: `${run.id}`,
          to: {
            name: ROUTE_NAMES.RUN_RESULTS,
            params: { ...urlContext.value, id: run.id },
          },
          hide: !run.id,
        },
        findings: {
          name: findings.label ?? '',
          to: findings.to
            ? findings.to
            : {
                name: ROUTE_NAMES.FINDINGS_OVERVIEW,
                params: { ...urlContext.value, id: null },
                query: { configId: configuration.id },
              },
          hide: !findings.label,
        },
      },
      runId: run.id ? Number(run.id) : undefined,
    }
  }

  const clearRelationStore = () => {
    relation.value = undefined
    runId.value = undefined
  }

  return { relation: relation, setSmartRelation, clearRelationStore }
}

export const useRelationStore = () =>
  defineStore('relation-store', runRelationStore, {
    // NOTE: Since `pinia-shared-state` is enabled globally
    // we disable shared state for this composable so having page open one tab
    // doesn't affect the other tab
    share: { enable: false },
  })()
