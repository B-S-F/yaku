<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <VuetifyViewLoadingIndicator v-if="!isLoaded" />
  <main v-else class="span-8-center findings-results-layout">
    <VuetifyToolbar>
      <VuetifyBackLink :to="backLink.to" />
      <div class="heading-wrapper">
        <h1 class="heading -size-l" :title="finding?.metadata?.name ?? finding?.criterion">
          {{ finding?.metadata?.name ?? finding?.criterion }}
        </h1>
      </div>
      <div class="toolbar-gap">
        <!-- <FrokButton tertiary icon="edit">
          Edit
        </FrokButton>
        <FrokButton tertiary icon="share">
          Share
        </FrokButton> -->
      </div>
    </VuetifyToolbar>
    <VuetifyFindingDetail v-if="finding && configName" :key="id" class="box bg-background" :finding="finding" @resolve="onResolve"
      @unresolve="onUnresolve" />
  </main>
  <Teleport to="#app">
    <FrogNotificationBar :show="!!error" variant="banner" type="error" full-width with-icon center-icon
      no-content-margin>
      <VuetifyBannerContent :label="error" @close="error = undefined" />
    </FrogNotificationBar>
  </Teleport>
</template>

<script setup lang="ts">
import type { Config, Finding } from '~/types'
import { ApiError, GetRun } from '~/api'
import type { Ref } from 'vue'
import { watchEffect, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useConfigStore } from '~/store/useConfigStore'
import { useRelationStore } from '~/store/useRelationStore'
import { useUrlContext, useYakuBrowseHistory } from '~composables'
import {
  storeContext,
  useApiCore,
  useApiFinding,
  useApiNetworkError,
} from '~api'
import { useRunStore } from '~/store/useRunStore'
import { provideRequestError } from '~helpers'
import useKeycloakStore from '~/store/useKeycloakStore'
import { storeToRefs } from 'pinia'

// TODO: Msal remove
// const { accounts } = useMsal()
const route = useRoute()
const id = route.params.id as string

const api = useApiCore()
const findingApi = useApiFinding()
const { urlContext } = useUrlContext()
const backLink = computed(() => ({
  label: 'Back to Findings Overview',
  to: { name: 'Findings', params: urlContext.value },
}))

const configStore = useConfigStore(storeContext)
const configName = computed(() => {
  const configId = finding.value?.configId
  if (configId === undefined) return
  return configStore.getById(configId)?.name
})

/** If undefined, then set to the first finding through selectedId. If thre result will become undefined, then reuse the previous value */
const finding: Ref<Finding | undefined> = ref()
const isLoaded = ref(false)
const error = ref<string>()

const keycloakStore = useKeycloakStore()
const { user } = storeToRefs(keycloakStore)
/** register the configuration to the user browsing history */
watchEffect(() => {
  const configId = finding.value?.configId
  if (configId) useYakuBrowseHistory().push({ configId })
})

findingApi
  .getFinding({ id })
  .then(async (r) => {
    if (!r.ok) {
      error.value = ((await r.json()) as ApiError).message
    } else {
      finding.value = (await r.json()) as Finding
      updateRelatedConfig(finding.value.configId)
    }
    isLoaded.value = true
  })
  .catch(() => {
    error.value = useApiNetworkError()
  })

// TODO duplicate of RunOverviewFetcher and FindingDetail, needs refactor
const updateRelatedConfig = async (configId: number) => {
  const configCandidate = configStore.getById(configId)
  if (configCandidate) return
  // fetch the related configurations if it does not exist
  try {
    const rConfig = await api.getConfig({ configId })
    if (!rConfig.ok) return // TODO: api error? or silent one
    const config = (await rConfig.json()) as Config
    configStore.push([config])
  } catch (e) {
    error.value = useApiNetworkError()
  }
}

const onResolve = async (resolvedComment: string) => {
  // const userId = accounts.value.at(0)?.idTokenClaims?.oid
  try {
    const r = await findingApi.updateFinding({
      id,
      status: 'resolved',
      resolvedComment,
      resolver: user.value?.uuid,
    })
    if (!r.ok) {
      error.value = ((await r.json()) as ApiError).message
    } else {
      finding.value = (await r.json()) as Finding
    }
  } catch (e) {
    error.value = useApiNetworkError()
  }
}

const onUnresolve = async () => {
  try {
    const r = await findingApi.updateFinding({
      id,
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
  } catch (e) {
    error.value = useApiNetworkError()
  }
}

// ----------------------
//  Navigation im Header
// ----------------------
const runStore = useRunStore(storeContext)
const relationStore = useRelationStore()

watchEffect(async () => {
  if (!finding.value) return

  const { configId, runId } = finding.value
  const relatedConfig = configStore.getById(configId)
  if (!relatedConfig) return

  try {
    const r = await api.getRun({ runId })
    if (r.ok) {
      const run = (await r.json()) as GetRun
      runStore.push([run])
    } else {
      error.value = await provideRequestError(r)
    }
  } catch (e) {
    error.value = useApiNetworkError()
  }

  relationStore.setSmartRelation({
    configuration: {
      id: relatedConfig.id.toString(),
      name: relatedConfig.name,
    },
    run: {
      id: finding.value.runId.toString(),
    },
    findings: {
      /** redirect to the same page */
      to: {
        name: 'FindingsResults',
        params: { ...urlContext.value, id: finding.value.id },
      },
      label: finding.value.metadata?.name ?? finding.value.criterion,
    },
  })
})
</script>

<style scoped lang="scss">
@use '../../styles/tokens.scss' as *;
@use '../../styles/abstract' as *;

.findings-results-layout {
  padding-top: $viewPadding;
  display: flex;
  flex-direction: column;
  row-gap: $space-section;
}

.heading-wrapper {
  min-width: 0;
}

.heading {
  margin: 0;
  @extend %inline-ellipsis;
}

.box~.box {
  margin-top: 32px;
}
</style>
