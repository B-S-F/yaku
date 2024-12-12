<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <VuetifyOverviewLayout class="findings-layout" :emptyOverview="isLoaded && totalFindings === 0">
    <template v-if="isLoaded && totalFindings != 0" #toolbar>
      <VuetifyToolbar v-if="backLink">
        <VuetifyBackLink :to="backLink.to" :label="backLink.label" />
        <div v-if="configIdFilter && configMap[configIdFilter]" class="pre-selection truncated">
          <h1 class="text-h6">
            {{ runIdFilter ? `Findings of run #${urlParams.runId} for ${configMap[configIdFilter].name}`
              : `Findings for ${configMap[configIdFilter].name}` }}
          </h1>
        </div>
        <!-- Feature removed from API atm -->
        <!-- <div class="lonely-toolbar-item">
          <FrokTextInput id="findings-search" v-model="search" type="search"
            placeholder="Name, description, package, id, ..." />
        </div> -->
      </VuetifyToolbar>
      <div v-else class="invisible-gap" /> <!-- To match the grid layout -->
    </template>

    <template v-if="isLoaded && totalFindings != 0" #filters>
      <div class="filters">
        <ul class="semantic-list">
          <li v-for="item in FILTERS" :key="item.value">
            <FrogChip :id="item.value"
              :label="item.label + ` (${item.label === 'Resolved' ? totalFindingsResolved : totalFindingsUnresolved}/${totalFindings})`"
              :selected="item.value === selectedFilter" @click="handleSelectFilter(item.value)" />
          </li>
        </ul>
        <div class="select-filters">
          <VuetifyYakuDropdown id="findings-group-by" v-model="selectedGroupBy" v-model:open="showGroupByDropdown" clear
            dynamicWidth icon="mdi-shape-plus-outline" data-cy="group-by" label="Group By"
            :options="GROUP_BY_OPTIONS" />
          <!-- the finding API does not support the group by operation and the sort by parameter is used instead. Both goup By and sort by can not be used together at the moment. -->
          <VuetifyYakuDropdown id="findings-sort-by" v-model="selectedSortBy" v-model:open="showSortByDropdown" clear
            dynamicWidth icon="mdi-sort-alphabetical-variant" data-cy="sort-by" label="Sort by"
            :disabled="!!selectedGroupBy?.value" :options="SORT_BY_OPTIONS" />
        </div>
      </div>
    </template>

    <template
      v-if="isLoaded && selectedFilter === 'resolved' ? totalFindingsResolved != 0 : totalFindingsUnresolved != 0">
      <!-- Group by nothing -->
      <VuetifyOverviewList v-if="!selectedGroupBy" class="ungrouped finding-list" :items="findings" :throttle="500"
        @bottom="getNextFindings">
        <template #item="{ item: finding }">
          <VuetifyFindingItem :finding="finding" :configName="configMap[finding.configId]?.name ?? null" />
        </template>
      </VuetifyOverviewList>
      <!-- Group by configuration -->
      <VuetifyOverviewList v-else-if="selectedGroupBy.value === 'configId'" class="config-list"
        :items="findingsByConfig" gap="space-elements" @bottom="getNextFindings">
        <template #item="{ item: group }">
          <header class="group-by-header">
            <h3 class="heading text-h6">
              {{ group.config.name }}
            </h3>
            <FrogChip :id="`findings-of-${group.config.id}`"
              :label="`${group.findingsOfConfig.length} finding${group.findingsOfConfig.length > 1 ? 's' : ''}`" />
          </header>
          <ul class="semantic-list grouped finding-list">
            <li v-for="finding in group.findingsOfConfig" :key="`${group.config.id}-${finding.id}`">
              <VuetifyFindingItem headingTag="h4" :finding="finding"
                :configName="configMap[finding.configId]?.name ?? null" />
            </li>
          </ul>
        </template>
      </VuetifyOverviewList>
    </template>
    <VuetifyNoItems v-else-if="isLoaded" label="No Findings yet" data-cy="empty-view">
      <template #title>
        <span>Go to the configurations to execute a run</span>
      </template>
      <RouterLink class="a-button-link svg-button" :to="{ name: ROUTE_NAMES.CONFIGS_OVERVIEW, params: urlContext }">
        Configuration Overview
      </RouterLink>
    </VuetifyNoItems>
    <VuetifyViewLoadingIndicator v-else />
    <Teleport to="#app">
      <FrogNotificationBar :show="!!error" variant="banner" type="error" full-width with-icon center-icon
        no-content-margin>
        <VuetifyBannerContent :label="error" @close="error = undefined" />
      </FrogNotificationBar>
    </Teleport>
  </VuetifyOverviewLayout>
</template>

<script setup lang="ts">
import { useUrlSearchParams, watchThrottled } from '@vueuse/core'
import { computed, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { GetFindings, GetFindingsParams, GetRuns } from '~/api'
import useConfigFindings from '~/composables/useConfigFindings'
import { findingsLabel } from '~/helpers/getFindingsCrossNavigationString'
import { ROUTE_NAMES } from '~/router'
import { useConfigStore } from '~/store/useConfigStore'
import { useRelationStore } from '~/store/useRelationStore'
import { useRunStore } from '~/store/useRunStore'
import type { Config, Finding, FindingStatus, SelectItem } from '~/types'
import {
  storeContext,
  useApiCore,
  useApiFinding,
  useApiNetworkError,
} from '~api'
import { useUrlContext } from '~composables'
import { provideRequestError } from '~helpers'

const SORT_BY_OPTIONS: SelectItem<NonNullable<GetFindingsParams['sortBy']>>[] =
  [
    { value: 'runCompletionTime', label: 'Date' },
    { value: 'updatedAt', label: 'Last update' },
    { value: 'occurrenceCount', label: 'Occurrence count' },
  ]
const DEFAULT_SORT_OPTION = SORT_BY_OPTIONS[0]

const GROUP_BY_OPTIONS = [
  { value: 'configId', label: 'Configuration' },
] as const

const route = useRoute()
const urlParams = useUrlSearchParams('history', {
  removeNullishValues: true,
  removeFalsyValues: true,
})

const api = useApiCore()
const { urlContext } = useUrlContext()
const findingApi = useApiFinding()

const findings = ref<Finding[]>([])
const totalFindings = ref<number>(0)
const totalFindingsUnresolved = ref<number>(0)
const totalFindingsResolved = ref<number>(0)
const isLoaded = ref<boolean>(false)
/** the link on scroll to the next page */
const nextPage = ref<string>()
const nextPageNumber = ref<number>()
const error = ref<string>()

const configStore = useConfigStore(storeContext)
const { findingsAmount, getFindingsCount } = useConfigFindings()

const backLink = computed(() =>
  runIdFilter.value || configIdFilter.value
    ? {
        label: 'Back to all findings',
        to: { name: 'Findings', params: urlContext.value },
      }
    : undefined,
)

const configMap = computed(() =>
  configStore.configs.reduce(
    (acc, c) => {
      acc[c.id] = c as Config
      return acc
    },
    {} as Record<string, Config>,
  ),
)
// ---------
//  Filters
// ---------
const showGroupByDropdown = ref(false)
const selectedGroupBy = ref(
  GROUP_BY_OPTIONS.find((g) => g.value === urlParams.groupBy),
)
watchEffect(() => {
  const val = selectedGroupBy.value?.value ?? ''
  if (urlParams.groupBy !== val) {
    urlParams.groupBy = val
  }
})

const showSortByDropdown = ref(false)
const selectedSortBy = ref(
  SORT_BY_OPTIONS.find((s) => s.value === urlParams.sortBy) ??
    DEFAULT_SORT_OPTION,
)
watchEffect(() => {
  const val = selectedSortBy.value?.value ?? ''
  if (urlParams.sortBy !== val) {
    urlParams.sortBy = val
  }
})

const hideResolved = computed({
  get() {
    return urlParams.hideResolved !== 'false'
  },
  set(v: boolean) {
    urlParams.hideResolved = v ? 'true' : 'false'
  },
})

const FILTERS: SelectItem<FindingStatus>[] = [
  {
    value: 'unresolved',
    label: 'Unresolved',
  },
  {
    value: 'resolved',
    label: 'Resolved',
  },
]

const selectedFilter = ref('unresolved')

const router = useRouter()

const handleSelectFilter = async (filter: FindingStatus) => {
  if (!filter) return
  if (filter === selectedFilter.value) {
    hideResolved.value = false
    selectedFilter.value = ''
    router.replace({
      query: {
        ...route.query,
        hideResolved: undefined,
      },
    })
    return
  }
  hideResolved.value = filter !== 'resolved'
  selectedFilter.value = filter
}

const runIdFilter = computed(() => route.query.runId as string | undefined)
const configIdFilter = computed(
  () => route.query.configId as string | undefined,
)

const search = ref('')
// ----------------------
//  Cross section Header
// ----------------------
const runStore = useRunStore(storeContext)
const relationStore = useRelationStore()

watchEffect(async () => {
  if (!configIdFilter.value) return

  const configId = configIdFilter.value
  const config = configMap.value[configId]
  await getFindingsCount(configId, true)

  if (!config) return
  let runId: string | undefined | null = runIdFilter.value

  try {
    if (!runId) {
      const runs = await api.getLastRunOfConfigs({
        filter: { configIds: [Number(configId)] },
      })
      const { data } = (await runs.json()) as GetRuns
      const run = data.at(0)
      if (!run) throw new Error()
      if (runStore && typeof runStore.push === 'function') runStore.push([run])
      runId = run.id.toString() ?? null
    }
  } catch (e) {
    console.error(e)
  }
  if (runId == null) return

  relationStore.setSmartRelation({
    configuration: {
      id: configId,
      name: config.name,
    },
    run: {
      id: runId,
    },
    findings: {
      label: findingsLabel(findingsAmount.value),
    },
  })
})

// ---------
//  Fetcher
// ---------
const configFetched = new Set<Config['id']>()
const updateRelatedConfig = async (configId: number) => {
  if (configFetched.has(configId)) return
  configFetched.add(configId)

  const configCandidate = configStore.getById(configId)
  if (configCandidate) return
  // fetch the related configurations if it does not exist
  try {
    const rConfig = await api.getConfig({ configId })
    if (!rConfig.ok) {
      console.error(await provideRequestError(rConfig))
      return
    }
    const config = (await rConfig.json()) as Config
    configStore.push([config])
  } catch (e) {
    console.error(e)
  }
}

const getFindingsParams = () => {
  const [sortBy, sortOrder] = selectedGroupBy.value?.value
    ? [selectedGroupBy.value.value, 'DESC' as const]
    : [selectedSortBy.value?.value, 'DESC' as const]
  return {
    configIdFilter,
    runIdFilter,
    hideResolved,
    search,
    sortBy,
    sortOrder,
  }
}

const fetchFindings = async (nextPageUrl?: string) => {
  const {
    configIdFilter,
    runIdFilter,
    hideResolved,
    search,
    sortBy,
    sortOrder,
  } = getFindingsParams()
  try {
    const filters = {
      configId: configIdFilter.value,
      runId: runIdFilter.value,
      hideResolved: selectedFilter.value ? hideResolved.value : undefined,
      search: search.value,
    }

    const r = await findingApi.getFindings({
      pagination: {
        items: '100',
        page: nextPageUrl ? nextPageNumber.value?.toString() : '',
      },
      filters,
      sortBy,
      sortOrder,
    })

    if (!r.ok) {
      error.value = await r.json()
      return
    }
    const { pagination, data, links } = (await r.json()) as GetFindings
    for (const finding of data) {
      await updateRelatedConfig(finding.configId)
    }
    if (nextPageUrl) {
      findings.value.push(...data)
    } else {
      findings.value = data
    }
    nextPage.value = links.next
    nextPageNumber.value = pagination.pageNumber + 1
  } catch (e) {
    error.value = useApiNetworkError()
  }
}

const getFindingsAmount = async (hideResolved: boolean) => {
  try {
    const filters = {
      configId: configIdFilter.value,
      runId: runIdFilter.value,
      hideResolved: hideResolved, // true | false
      search: search.value,
    }

    const r = await findingApi.getFindings({
      pagination: { items: '100' },
      filters,
    })

    if (!r.ok) {
      error.value = await r.json()
      return
    }
    const { pagination, data } = (await r.json()) as GetFindings
    for (const finding of data) {
      await updateRelatedConfig(finding.configId)
    }
    if (hideResolved) {
      totalFindingsUnresolved.value = pagination?.totalCount ?? 0
    } else {
      totalFindingsResolved.value = pagination?.totalCount ?? 0
    }
    totalFindings.value =
      totalFindingsResolved.value + totalFindingsUnresolved.value
  } catch (e) {
    error.value = useApiNetworkError()
  }
}

/** throttle to avoid to much requests while typing in the search */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
watchThrottled(
  [
    selectedGroupBy,
    selectedSortBy,
    hideResolved,
    configIdFilter,
    runIdFilter,
    search,
    selectedFilter,
  ],
  async () => {
    await fetchFindings()
    await getFindingsAmount(true)
    await getFindingsAmount(false)
    isLoaded.value = true
  },
  { immediate: true, throttle: 750 },
)

const getNextFindings = async () => {
  if (!nextPage.value) return
  await fetchFindings(nextPage.value)
}

// -------------------------
//   Related data structure
// -------------------------
const findingsByConfig = computed(() => {
  const configIds = findings.value.reduce((acc, f) => {
    acc.add(f.configId)
    return acc
  }, new Set<number>())

  const acc: { id: string; config: Config; findingsOfConfig: Finding[] }[] = []
  ;[...configIds.values()].forEach((id) => {
    const config = configStore.getById(id)
    if (config) {
      acc.push({
        id: `config-${config.id}`,
        config,
        findingsOfConfig: findings.value.filter((f) => f.configId === id),
      })
    }
  })
  return acc
})
</script>

<style scoped lang="scss">
@use '../../styles/components/overview-item.scss' as *;
@use '../../styles/mixins/flex.scss' as *;

.findings-layout {

  .invisible-gap {
    visibility: hidden;
    pointer-events: none;
  }

  :deep(.toolbar) {
    min-height: 64px;
  }

  .ungrouped.finding-list,
  .config-list {
    @extend %overview-with-pill;
  }
}

.filters {
  display: flex;
  align-items: center;
  justify-content: space-between;

  ul.semantic-list {
    @include flexbox;
    column-gap: $spacing-16;
  }

  .select-filters {
    @include flexbox;
  }
}

// ------------------
//  Raw Finding List
// ------------------
.finding-list {
  display: flex;
  flex-direction: column;
  row-gap: $space-component-s;
  overflow-y: auto;
}

// ----------------------
//  Group by config list
// ----------------------
.config-list {
  display: flex;
  flex-direction: column;
  row-gap: $space-component-l;
  overflow-y: auto;

  :deep(.overview-list > li) {
    display: flex;
    flex-direction: column;
  }
}

.group-by-header {
  position: sticky;
  top: 0;
  z-index: 2;
  background-color: var(--v-theme-background);
  padding: 8px;
  display: flex;
  justify-content: space-between;
  // to be over the status pills
  border-bottom: solid 16px var(--v-theme-background);

  .heading {
    margin: 0;
  }

  &::after {
    position: absolute;
    bottom: 0;
    content: "";
    height: 16px;
    width: calc(100%);
    transform: translate(-8px, 100%);
    background-color: var(--v-theme-background);
  }
}

.truncated {
  overflow: hidden;

  h1 {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
