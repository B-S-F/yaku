<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <VuetifyOverviewLayout class="releases-layout">
    <div class="onboarding-element-without-focus top-80" data-onboarding="releases" />
    <template #toolbar>
      <VuetifyToolbar class="toolbar-releases-overview" data-onboarding="release-toolbar">
        <div class="toolbar-gap">
          <FrogButton secondary icon="mdi-plus" data-cy="create-button" @click="showCreateReleaseDialog = true">
            <span>Create Release</span>
          </FrogButton>
        </div>
        <!--        <div class="toolbar-gap actions">
          <RouterLink :to="{}">
            <FrokPopover v-bind="TOOLTIP_CONFIG" :deactivate="breakpoints.from820">
              <template #content>
                Switch to graphical view
              </template>
<FrokButton class="switch-view-btn nowrap" :class="{ 'sidebar-open': isSidebarOpen }" secondary :disabled="true"
  icon="timeline" tabindex="-1">
  <span class="at-toolbar-1400">Switch to graphical view</span>
</FrokButton>
</FrokPopover>
</RouterLink>
<FrokTextInput id="release-search" v-model="search" class="search" disabled type="search" placeholder="Search..." />
</div>-->
      </VuetifyToolbar>
    </template>

    <template #filters>
      <div class="placeholder" />
    </template>

    <VuetifyOverviewList v-if="releases && releases.length > 0" class="releases-list" :items="releases"
      @bottom="fetcher.next">
      <template #item="{ item: release }">
        <VuetifyReleaseOverviewItem :release="release" :config="configsOfReleases[release.qgConfigId]?.name"
          :findingsCount="findingsOfConfig[release.qgConfigId]?.findingCount" data-onboarding="release-item"
          @delete="releaseToDelete = release" />
      </template>
    </VuetifyOverviewList>
    <VuetifyNoItems v-else-if="!releases.length" label="No Releases yet" data-cy="empty-view">
      <FrogButton class="svg-button" @click="showCreateReleaseDialog = true">
        Create Release
      </FrogButton>
    </VuetifyNoItems>

    <Teleport to="#app">
      <VuetifyDialogCreateRelease v-if="showCreateReleaseDialog" @close="showCreateReleaseDialog = false"
        @createRelease="onCreateRelease" />
      <VuetifyScreenCenter v-show="releaseToDelete">
        <DeleteReleaseConfirmation :name="releaseToDelete?.name ?? ''" @confirm="onReleaseDelete"
          @cancel="releaseToDelete = null" />
      </VuetifyScreenCenter>
      <VuetifyViewLoadingIndicator v-show="fetcher.isFetching.value && releases.length === 0" />
      <FrogNotificationBar :show="!!apiError" variant="banner" type="error" full-width with-icon center-icon
        no-content-margin>
        <VuetifyBannerContent :label="apiError" @close="apiError = undefined" />
      </FrogNotificationBar>
    </Teleport>
  </VuetifyOverviewLayout>
</template>

<script setup lang="ts">
import type { ApiError, CreateReleasePayload, NewReleaseApprover } from '~/api'
import { ref, defineAsyncComponent } from 'vue'
import { useApiReleases } from '~/composables/api/useApiReleases'
import { storeContext, useApiNetworkError } from '~/composables/api'
import { Release } from '~/types/Release'
import { useReleaseStore } from '~/store/useReleaseStore'
import { Config } from '~/types'
import { useReleasesOverviewFetcher } from '~/composables/fetcher/useReleasesOverviewFetcher'
import { useDebugMode } from '~/composables'
import { storeToRefs } from 'pinia'

const DeleteReleaseConfirmation = defineAsyncComponent(
  () => import('~/components/organisms/VuetifyDeleteReleaseDialog.vue'),
)
const releaseStore = useReleaseStore(storeContext)
const { releases } = storeToRefs(releaseStore)

const findingsOfConfig = ref<Record<Config['id'], { findingCount: number }>>({})
const configsOfReleases = ref<Record<Config['id'], { name: string }>>({})
const showCreateReleaseDialog = ref(false)
const apiRelease = useApiReleases()
const apiError = ref<string>()
useDebugMode({ errorState: apiError })

const fetcher = useReleasesOverviewFetcher({
  findingsOfConfig,
  configsOfReleases,
})

fetcher.next()

const error = ref<string>()
const onCreateRelease = async (payload: {
  release: CreateReleasePayload
  approvers: NewReleaseApprover[]
}) => {
  showCreateReleaseDialog.value = !showCreateReleaseDialog.value
  try {
    const r = await apiRelease.createRelease(payload.release)
    if (r.ok) {
      const json = (await r.json()) as Release
      releaseStore.addRelease([json], { position: 'top' })
      // Proceed to add approvers
      if (payload.approvers && payload.approvers.length) {
        const requests = payload.approvers.map(
          async (a) =>
            await apiRelease.addApproval({
              releaseId: json.id,
              user: a.id,
            }),
        )

        await Promise.allSettled(requests)
      }
      window.location.reload()
    } else {
      apiError.value = ((await r.json()) as ApiError).message
    }
  } catch (err) {
    apiError.value = useApiNetworkError()
  }
}

const releaseToDelete = ref<Release | null>(null)
const onReleaseDelete = async () => {
  const releaseId = releaseToDelete.value?.id
  if (!releaseId) return
  try {
    const r = await apiRelease.deleteRelease(releaseId)
    if (!r.ok) {
      apiError.value =
        r.status === 500
          ? 'The server does not respond. Please try again later.'
          : ((await r.json()) as ApiError).message
      return
    }
    releaseStore.removeById(releaseId)
  } catch (e) {
    error.value = useApiNetworkError()
  }
  releaseToDelete.value = null
}
</script>

<style scoped lang="scss">
@use '../../styles/components/overview-item.scss' as *;
@use '../../styles/tokens.scss' as *;
@use '../../styles/helpers.scss' as *;

@media screen and (max-width: $bp-max-820) {
  .releases-layout {
    :deep(li a.overview-item-layout .details > *) {
      width: 150px;
    }
  }
}

.releases-list {
  @extend %overview-with-pill;
}

.on-lt-md {
  display: none;
}

/* TODO: Flex class utilities */
.actions {
  flex-direction: row;
  justify-content: flex-end;
  flex-grow: 1;
}

.toolbar-releases-overview {
  :deep(.switch-view-btn) {
    @media screen and (max-width: $bp-max-820) {
      @include hide-label-and-center-icon;
    }

    &.sidebar-open {
      @media screen and (max-width: $bp-max-1440) {
        @include hide-label-and-center-icon;
      }
    }
  }
}
</style>
