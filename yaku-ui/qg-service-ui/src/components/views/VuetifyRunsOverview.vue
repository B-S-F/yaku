<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <VuetifyOverviewLayout :emptyOverview="!sortedRuns || sortedRuns.length === 0">
    <div class="onboarding-element-without-focus" data-onboarding="runs-overview" />
    <template v-if="sortedRuns && sortedRuns.length > 0" #toolbar>
      <VuetifyToolbar>
        <div class="lonely-toolbar-item">
          <FrogTextInput id="config-search" v-model="search" type="search" placeholder="Name, run id, ..." />
        </div>
      </VuetifyToolbar>
    </template>

    <!-- not needed at the moment -->
    <!-- <template v-if="sortedRuns && sortedRuns.length > 0" #filters>
      <Filterbar v-model:selected="selectedFilters" :filters="FILTER_GROUP">
        <YakuDropdown id="findings-group-by" v-model="selectedGroupBy" v-model:open="showGroupByDropdown" disabled
          dynamicWidth icon="shape-circle-square" data-cy="group-by" label="Group By" :options="GROUP_BY_OPTIONS"
          style="margin-left: auto;" />
      </Filterbar>
    </template> -->

    <template v-if="sortedRuns && sortedRuns.length > 0 && configList.length > 0">
      <VuetifyOverviewList class="run-list" gap="space-elements" :items="configList" @bottom="fetcher.next">
        <template #item="{ item: config }">
          <ol class="semantic-list config-run-list" data-cy="run-list">
            <FrogButton :id="`show-older-${config.id}`" class="show-older-toggle" data-cy="show-older-toggle" tertiary
              :icon="showOlderRuns[config.id] ? 'mdi-chevron-up' : 'mdi-chevron-down'" iconRight
              @click="onShowOlderRunsToggle(config.id)">
              <VuetifyStack v-slot="{ visibleClass }">
                <span :class="{ [visibleClass]: !showOlderRuns[config.id] }">Show older runs</span>
                <span :class="{ [visibleClass]: showOlderRuns[config.id] }">Hide older runs</span>
              </VuetifyStack>
            </FrogButton>
            <li v-for="run in config.runs" :key="run.id" data-cy="runs-group">
              <VuetifyRunOverviewItem data-cy="run-item" :configName="config.name" :findingCount="findingsOfRun[run.id]"
                :run="run" :isDownloadingEvidence="downloadingEvidences.has(run.id)" data-onboarding="run-item"
                @show-log="showLogsOfRun = { ...$event, configName: config.name }"
                @download-evidences="onEvidencesDownload" @delete="runToDelete = $event" />
            </li>
          </ol>
          <FrogButton v-if="showOlderRuns[config.id] && moreRuns[config.id].more" :id="`show-more-${config.id}`"
            class="show-more" data-cy="show-more" tertiary @click="fetchLastRuns(config.id)">
            Show more
          </FrogButton>
        </template>
      </VuetifyOverviewList>
    </template>
    <VuetifyNoItems v-else label="No runs found" data-cy="empty-view">
      <template #title>
        <div class="no-items-text">
          <p><b>No runs found</b></p>
          <p>Try adjusting your search to find what you're looking for</p>
        </div>
      </template>
    </VuetifyNoItems>
    <Teleport to="#app">
      <VuetifyScreenCenter v-show="runToDelete">
        <VuetifyDeleteRunConfirmation :name="runToDelete?.id.toString() ?? ''" @confirm="onRunDelete"
          @cancel="runToDelete = undefined" />
      </VuetifyScreenCenter>
      <VuetifyViewLoadingIndicator v-show="fetcher.isFetching.value && sortedRuns.length === 0" />
      <FrogNotificationBar :show="!!apiError" variant="banner" type="error" full-width with-icon center-icon
        no-content-margin>
        <VuetifyBannerContent :label="apiError" @close="apiError = undefined" />
      </FrogNotificationBar>
    </Teleport>
  </VuetifyOverviewLayout>
  <VuetifyLogsPanel v-if="showLogsOfRun" class="logs-panel"
    :config="{ id: showLogsOfRun.configId, name: showLogsOfRun.configName }" :run="showLogsOfRun"
    @click-outside="showLogsOfRun = undefined" @close="showLogsOfRun = undefined" />
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import type { ApiError, GetRuns } from '~/api'
import { useConfigStore } from '~/store/useConfigStore'
import { useRunStore } from '~/store/useRunStore'
import type { Config, LocalRun, Run } from '~/types'
import { storeContext, useApiCore, useApiNetworkError } from '~api'
import { useDebugMode, useRunOverviewFetcher } from '~composables'
import { provideRequestError } from '~helpers'
import VuetifyRunOverviewItem from '../organisms/VuetifyRunOverviewItem.vue'

const VuetifyDeleteRunConfirmation = defineAsyncComponent(
  () => import('~/components/organisms/VuetifyDeleteRunConfirmation.vue'),
)

const api = useApiCore()
const apiError = ref<string>()
useDebugMode({ errorState: apiError })

const configStore = useConfigStore(storeContext)
const runStore = useRunStore(storeContext)

const search = ref('')
const sanitizedSearch = computed(() => search.value.trim().toLowerCase())

// -------------------
//  Data Presentation
// -------------------
const sortedRuns = computed(() => {
  if (runStore.runs && Array.isArray(runStore.runs))
    return [...runStore.runs].sort((r1, r2) =>
      r1.creationTime.localeCompare(r2.creationTime),
    )
  else return []
})
const findingsOfRun = ref<Record<Run['id'], number | undefined>>({})
const showOlderRuns = ref<Record<Config['id'], boolean>>({})

const configList = computed(() => {
  // Declare utility functions
  const noSearchOp = () => true
  const searchOp = ({ name, runs }: (typeof configWithRuns)[number]) => {
    return (
      name.toLowerCase().includes(sanitizedSearch.value) ||
      runs.find(({ id }) => id.toString().includes(sanitizedSearch.value))
    )
  }
  const searchOperation = sanitizedSearch.value ? searchOp : noSearchOp
  const configWithRuns = configStore.configs
    .map((config) => {
      const nrOlderRuns =
        moreRuns.value[config.id].pageNumber > 1
          ? (moreRuns.value[config.id].pageNumber - 1) * DEFAULT_RUN_AMOUNT
          : DEFAULT_RUN_AMOUNT
      return {
        ...config,
        runs: runStore
          .getByConfigId(config.id)
          .slice(0, showOlderRuns.value[config.id] ? nrOlderRuns : 1),
      }
    })
    .filter((c) => c.runs.length > 0)

  // TODO: remove this local search once it is implemented from the API
  const r = configWithRuns
    .filter(searchOperation)
    // sort run (newest first)
    .sort((c1, c2) => {
      const [run1, run2] = [c1.runs[0], c2.runs[0]]
      return run2.id - run1.id
    })

  return r
})

const moreRuns = computed(() =>
  Object.fromEntries(
    configStore.configs.map((config) => {
      return [
        config.id,
        {
          pageNumber: 1,
          more: false,
        },
      ]
    }),
  ),
)

// ---------
//  Filters
// ---------
// const GROUP_BY_OPTIONS = [
//   { value: 'configuration', label: 'Configuration' },
// ] as const

// const selectedGroupBy = ref(GROUP_BY_OPTIONS.find((g) => g.value === route.query['groupBy']) ?? GROUP_BY_OPTIONS[0])
// watchEffect(() => {
//   if (router.currentRoute.value.name !== ROUTE_NAMES.RUNS_OVERVIEW) return

//   const val = selectedGroupBy.value?.value
//   if (route.query['groupBy'] !== val) {
//     router.push({ query: { 'groupBy': val } })
//   }
// })

const DEFAULT_RUN_AMOUNT = 3

// ---------------
//  Data Fetching
// ---------------
const fetcher = useRunOverviewFetcher({
  findingsOfRun,
  options: {
    groupBy: 'configuration',
  },
})
watch(fetcher.error, (newVal) => (apiError.value = newVal))

const fetchLastRuns = async (
  configId: Config['id'],
  amount = DEFAULT_RUN_AMOUNT,
) => {
  if (moreRuns.value[configId].pageNumber > 1 && !moreRuns.value[configId].more)
    return

  const r = await api.getRunsOfConfig({
    pagination: {
      items: amount.toString(),
      page: moreRuns.value[configId].pageNumber.toString(),
    },
    filter: { configId },
  })
  if (r.ok) {
    const { data, links } = (await r.json()) as GetRuns
    runStore.push(data)
    moreRuns.value[configId].more = !!links.next
    moreRuns.value[configId].pageNumber++
  } else {
    apiError.value = ((await r.json()) as ApiError).message
  }
}

// ---------------------------
//  Refresh the runs
// ---------------------------

const showLogsOfRun = ref<LocalRun & { configName: string }>()
watch(showLogsOfRun, async (newRun) => {
  if (!newRun || !!newRun.log) return
  try {
    const r = await api.getRun({ runId: newRun.id })
    if (r.ok && showLogsOfRun.value) {
      if (!showLogsOfRun.value) return
      showLogsOfRun.value.log = ((await r.json()) as Run).log
    } else {
      apiError.value = await provideRequestError(r)
    }
  } catch (e) {
    apiError.value = useApiNetworkError()
  }
})

// ---------
//  Actions
// ---------
const onShowOlderRunsToggle = (id: Config['id']) => {
  if (showOlderRuns.value[id]) {
    showOlderRuns.value[id] = false
  } else {
    showOlderRuns.value[id] = true
    // don't fetch the same runs multiple times
    if (moreRuns.value[id].pageNumber === 1) {
      fetchLastRuns(id)
    }
  }
}

const downloadingEvidences = ref(new Set<Run['id']>())
const onEvidencesDownload = async ({ id }: Run) => {
  downloadingEvidences.value.add(id)
  await api.downloadEvidenceFile({ runId: id })
  downloadingEvidences.value.delete(id)
}

// --------------
//  Run Deletion
// --------------
const runToDelete = ref<LocalRun>()
const onRunDelete = async () => {
  const id = runToDelete.value?.id
  if (id === undefined) return
  try {
    const r = await api.deleteRun({ runId: id })
    if (!r.ok) {
      apiError.value = ((await r.json()) as ApiError).message
      return
    }
    runStore.removeById(id)
  } catch (e) {
    apiError.value = useApiNetworkError()
  }
  runToDelete.value = undefined
}
</script>

<style scoped lang="scss">
.lonely-toolbar-item {
  justify-content: end;
  flex-grow: 1;
}

.config-run-header {
  display: flex;
  align-items: center;
  margin: 0 0 $space-component-s 0;
  column-gap: $space-label-s;

  h2 {
    margin: 0;
  }
}

.config-run-list {
  display: flex;
  flex-direction: column;
  row-gap: $space-component-s;
  position: relative; // for the "show older runs" button

  .show-older-toggle {
    display: flex;
    align-items: center;
    width: fit-content;
    z-index: 1;
    position: absolute;
    right: 0;
    top: 0;
    font-size: 0.875rem;

    :deep(>span) {
      padding: 10px 0px 10px $padding-component-s;
      margin: 0;
    }

    :deep(.v-icon) {
      font-size: 1.125rem;
      padding-right: $padding-component-s;
    }
  }
}

.logs-panel {
  top: #{$headerHeight}; // header size
  grid-row: 2 / -1;
  min-width: 800px;
  width: 33%;
  z-index: 2;

  // TODO: refactor this as layout
  height: calc(100vh - #{$headerHeight});
  max-height: calc(100vh - #{$headerHeight});
  border-top: none;
}

.no-items-text {
  text-align: center;

  p {
    margin: $spacing-4;
  }
}
</style>
