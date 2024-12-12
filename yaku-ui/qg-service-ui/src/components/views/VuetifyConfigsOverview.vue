<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <VuetifyOverviewLayout>
    <template #toolbar>
      <VuetifyToolbar>
        <div class="toolbar-gap">
          <FrogButton v-if="includeQuickStartupFeature" tertiary icon="mdi-play-outline" data-cy="quick-startup-toggle"
            @click="showQuickStartup = true">
            <span class="on-md">Start a test run</span>
            <span class="on-lt-md">Test run</span>
          </FrogButton>
          <FrogButton secondary icon="mdi-plus" data-cy="create-button" @click="showCreateConfig = true">
            <span class="on-md">Create a configuration</span>
            <span class="on-lt-md">Create</span>
          </FrogButton>
        </div>
        <div class="search-block">
          <FrogTextInput v-show="false" id="findings-search" v-model="search" type="search" placeholder="Name, ..." />
        </div>
      </VuetifyToolbar>
    </template>

    <!-- The EmptyState component has to fill the available space, so it needs to be put in the 3rd row -->
    <template #filters>
      <div class="placeholder" />
    </template>

    <VuetifyOverviewList v-if="filteredConfigs && filteredConfigs.length > 0" class="config-list"
      :items="filteredConfigs" @bottom="fetcher.next">
      <template #item="{ item: config }">
        <VuetifyConfigOverviewItem data-cy="configs-item" :config="config" :lastRun="lastRunOfConfigs[config.id]"
          :findingCount="findingsOfConfig[config.id]?.findingCount" @start-run="onStartRun(config.id)"
          @show-logs="onShowLogs(config, lastRunOfConfigs[config.id])" @delete="configToDelete = config"
          @copy="configToCopy = config.id" />
      </template>
    </VuetifyOverviewList>
    <VuetifyNoItems v-else-if="!fetcher.isFetching.value" label="No Configurations yet" data-cy="empty-view">
      <FrogButton class="svg-button" @click="showCreateConfig = true">
        Create Configuration
      </FrogButton>
    </VuetifyNoItems>

    <Teleport to="#app">
      <VuetifyCreateConfigDialog v-show="showCreateConfig" :showDialog="showCreateConfig"
        @close="showCreateConfig = false" @copy-config="onNewCopyConfig" />
      <VuetifyQuickStartupDialog v-show="showQuickStartup" :showDialog="showQuickStartup"
        @close="showQuickStartup = false" />
      <VuetifyScreenCenter v-show="configToDelete">
        <VuetifyDeleteConfigurationConfirmation :config-name="configToDelete?.name ?? ''" @confirm="onConfigDelete"
          @cancel="configToDelete = null" />
      </VuetifyScreenCenter>
      <VuetifyScreenCenter v-if="configToCopy || showCopyConfigDialog" v-show="configToCopy || showCopyConfigDialog">
        <VuetifyCopyConfigDialog :config-id="configToCopy" @close="onCloseCopyConfigDialog" />
      </VuetifyScreenCenter>
      <VuetifyViewLoadingIndicator v-show="fetcher.isFetching.value && configStore.configs.length === 0" />
      <FrogNotificationBar :show="!!apiError" variant="banner" type="error" full-width with-icon center-icon
        no-content-margin>
        <VuetifyBannerContent :label="apiError" @close="apiError = undefined" />
      </FrogNotificationBar>
      <FrogNotificationBar v-if="!!copiedConfig" variant="banner" class="copy-success-banner" type="neutral"
        :show="!!copiedConfig" full-width with-icon center-icon customIcon="alert-success">
        <VuetifyBannerContent :is-toast="false" @close="copiedConfig = undefined">
          <p>
            Configuration copied successfully <RouterLink
              :to="{ name: ROUTE_NAMES.CONFIG_EDIT, params: { ...urlContext, id: copiedConfig } }">
              Jump to new
              configuration
            </RouterLink>
          </p>
        </VuetifyBannerContent>
      </FrogNotificationBar>
      <VuetifyLogsPanel v-if="showLogsOfRun" class="logs-panel"
        :config="{ id: showLogsOfRun.configId, name: showLogsOfRun.configName }" :run="showLogsOfRun"
        @click-outside="showLogsOfRun = undefined" @close="showLogsOfRun = undefined" />
    </Teleport>
  </VuetifyOverviewLayout>
</template>

<script setup lang="ts">
import {
  computed,
  defineAsyncComponent,
  onMounted,
  ref,
  watchEffect,
} from 'vue'
import { useRouter } from 'vue-router'
import type { ApiError, GetRun } from '~/api'
import { useDebugMode } from '~/composables/useDebugMode'
import { useSimpleSearch } from '~/composables/useSimpleSearch'
import { ROUTE_NAMES } from '~/router'
import { useConfigStore } from '~/store/useConfigStore'
import { useRunStore } from '~/store/useRunStore'
import type { Config, Run } from '~/types'
import { storeContext, useApiCore, useApiNetworkError } from '~api'
import { useConfigsOverviewFetcher, useUrlContext } from '~composables'
import VuetifyCopyConfigDialog from '../molecules/VuetifyCopyConfigDialog.vue'

const VuetifyCreateConfigDialog = defineAsyncComponent(
  () => import('~/components/organisms/VuetifyCreateConfigDialog.vue'),
)
const VuetifyQuickStartupDialog = defineAsyncComponent(
  () => import('~/components/organisms/VuetifyQuickStartupDialog.vue'),
)
const VuetifyLogsPanel = defineAsyncComponent(
  () => import('~/components/organisms/VuetifyLogsPanel.vue'),
)
const VuetifyDeleteConfigurationConfirmation = defineAsyncComponent(
  () =>
    import('~/components/organisms/VuetifyDeleteConfigurationConfirmation.vue'),
)

const includeQuickStartupFeature =
  import.meta.env.VITE_TEST_RUN_FEATURE === 'true'

const showCreateConfig = ref(false)
const showQuickStartup = ref(false)

const router = useRouter()
const { urlContext } = useUrlContext()

const api = useApiCore()
const apiError = ref<string>()
useDebugMode({ errorState: apiError })

// -----------------
//  Data structures
// -----------------
const configStore = useConfigStore(storeContext)
const lastRunOfConfigs = ref<Record<Config['id'], Run | null | undefined>>({})
const findingsOfConfig = ref<Record<Config['id'], { findingCount: number }>>({})

// ---------------
//  Data Fetching
// ---------------
const fetcher = useConfigsOverviewFetcher({
  lastRunOfConfigs,
  findingsOfConfig,
})
// Fetch the first configurations
fetcher.next()

// ---------
//  Filters
// ---------
const search = ref('')

// sort configs by last edit date. Last edit first.
const { results: filteredConfigs } = useSimpleSearch({
  search: search,
  candidates: computed(() => configStore.configs),
  searchIn: ['name'],
})
watchEffect(() =>
  filteredConfigs.value.sort((a, b) =>
    b.lastModificationTime.localeCompare(a.lastModificationTime),
  ),
)

// ---------
//  Actions
// ---------
const onStartRun = async (configId: number) => {
  try {
    const r = await api.postRun({ configId })
    if (r.ok) {
      router.push({ name: ROUTE_NAMES.RUNS_OVERVIEW, params: urlContext.value })
    } else {
      apiError.value = ((await r.json()) as ApiError).message
    }
  } catch (e) {
    apiError.value = useApiNetworkError()
  }
}

const showLogsOfRun = ref<
  (Run & { configId: number; configName: string }) | undefined
>(undefined)
const onShowLogs = async (config: Config, run: Run | null | undefined) => {
  if (!run) return
  const runStore = useRunStore(storeContext)
  try {
    const r = await api.getRun({ runId: run.id })
    if (r.ok) {
      const run = (await r.json()) as GetRun
      runStore.push([run])
      showLogsOfRun.value = {
        ...run,
        configName: config.name,
        configId: config.id,
      }
    } else {
      apiError.value = ((await r.text()) as ApiError).message
    }
  } catch (e) {
    apiError.value = useApiNetworkError()
  }
}

const configToDelete = ref<Config | null>(null)
const showCopyConfigDialog = ref<boolean>(false)
const onCloseCopyConfigDialog = (id?: number) => {
  configToCopy.value = undefined
  showCopyConfigDialog.value = false
  configToCopy.value = undefined
  if (id) {
    copiedConfig.value = id
  }
}
const onNewCopyConfig = () => {
  if (showCreateConfig.value) {
    showCreateConfig.value = false
  }
  showCopyConfigDialog.value = true
}
const configToCopy = ref<number>()
const copiedConfig = ref<number>()
onMounted(() => {
  if (copiedConfig.value) {
    copiedConfig.value = undefined
  }
})
const onConfigDelete = async () => {
  const configId = configToDelete.value?.id
  if (configId === undefined) return
  try {
    const r = await api.deleteConfig({ configId })
    if (!r.ok) {
      apiError.value =
        r.status === 500
          ? 'Runs related to the configuration must first be deleted.'
          : ((await r.json()) as ApiError).message
      return
    }
    configStore.removeById(configId)
  } catch (e) {
    apiError.value = useApiNetworkError()
  } finally {
    configToDelete.value = null
  }
}
</script>


<style scoped lang="scss">
@use '../../styles/components/overview-item.scss' as *;
@use '../../styles/mixins/success-banner.scss' as SuccessBanner;

.config-list {
  @extend %overview-with-pill;
}

.search-block {
  justify-content: end;
  flex-grow: 1;

  :deep(input) {
    width: 350px;
  }
}

.status-inner-cell {
  height: 1.5rem
}

:deep(.status-popover--content) {
  justify-content: start !important;
}

:global(.out-of-sync-tooltip.m-popover) {
  transform: translate(0, -4px);
}

.logs-panel {
  top: calc(#{$headerHeight}); // header size
  min-width: 350px;
  width: 33%;

  --panel-height: calc(100vh - #{$headerHeight});
  height: var(--panel-height);
  max-height: var(--panel-height);
}

.overview-layout {
  row-gap: 0;

  .placeholder {
    visibility: hidden;
    height: 28px;
  }
}

.on-lt-md {
  display: none;
}

@media screen and (max-width: 1440px) {
  .on-md {
    display: none;
  }

  .on-lt-md {
    display: block;
  }
}

.copy-success-banner {
  @include SuccessBanner.bottom-success-banner;
}
</style>
