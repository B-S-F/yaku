<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <VuetifyOverviewLayout class="main" :emptyOverview="!isLoading && !hasSecret">
    <template v-if="!isLoading && hasSecret" #toolbar>
      <VuetifyToolbar>
        <div>
          <FrogButton secondary data-cy="secondary-create-button" @click="onAddSecret">
            Create Secret
          </FrogButton>
        </div>
        <div class="search-block">
          <FrogTextInput id="findings-search" v-model="search" type="search" placeholder="Name, description" />
        </div>
      </VuetifyToolbar>
    </template>

    <template v-if="!isLoading && hasSecret" #filters>
      <div>
        <VuetifyYakuDropdown id="findings-group-by" v-model="selectedSortBy" v-model:open="showSortBy" clear
          dynamicWidth icon="mdi-sort" data-cy="sort-by" label="Sort By" :options="SORT_BY_OPTIONS"
          style="margin-left: auto;" />
      </div>
    </template>

    <VuetifyOverviewList v-if="!isLoading && hasSecret" v-model:scrollToTopToggle="triggerScrollTop" class="secret-list"
      :items="sortedSecrets">
      <template #item="{ item: secret }">
        <section :id="`secret-${secret.name}`" class="secret-container" tabindex="0" data-cy="secret-item"
          @click="showEditSecretDialogWith = secret">
          <div class="secret-texts">
            <FrogIcon icon="mdi-lock-outline" />
            <VuetifyHoverableText class="font-weight-bold secret-name text-body-1" :label="secret.name" />
            <VuetifyHoverableText class="text-secondary smaller" :label="secret.description" />
          </div>
          <div class="secret-metadata">
            <span>Created at</span>
            <span class="smaller font-weight-bold">{{ isUnixEpoch(secret.creationTime) ? '-' : useRecentDateFormat(new
              Date(secret.creationTime)) }}</span>
          </div>
          <div class="secret-metadata">
            <span>Last Updated</span>
            <span class="smaller font-weight-bold">{{ secret.lastModificationTime === secret.creationTime ? '-' :
              useRecentDateFormat(new Date(secret.lastModificationTime)) }}</span>
          </div>
          <div class="secret-actions">
            <FrogPopover arrowPlacementClass="-without-arrow-top" attached triggerOnHover tooltipAlike
              :label="screenWidth <= 1250 ? EDIT_SECRET_LABEL : undefined">
              <FrogButton class="btn-label-at-sm" icon="mdi-file-edit-outline" data-cy="update-button"
                @click.stop="showEditSecretDialogWith = secret">
                {{ EDIT_SECRET_LABEL }}
              </FrogButton>
            </FrogPopover>
            <FrogPopover arrowPlacementClass="-without-arrow-top" attached triggerOnHover tooltipAlike
              label="Copy as code reference">
              <FrogButton tertiary icon="mdi-content-copy" @click.stop="onSecretCopy(secret.name)" />
            </FrogPopover>
            <FrogButton tertiary icon="mdi-delete-outline" data-cy="delete-button"
              @click.stop="showDeleteConfirmationOf = secret.name" />
          </div>
        </section>
      </template>
    </VuetifyOverviewList>

    <VuetifyNoItems v-else-if="!isLoading && secretStore.secrets.length === 0" label="No Secrets yet"
      data-cy="empty-view">
      <FrogButton data-cy="primary-create-button" @click="onAddSecret">
        Create Secret
      </FrogButton>
    </VuetifyNoItems>

    <FrogNotificationBar :show="!!apiError && !showEditSecretDialogWith" variant="banner" type="error" full-width
      with-icon center-icon>
      <VuetifyBannerContent :label="apiError" @close="apiError = undefined" />
    </FrogNotificationBar>
  </VuetifyOverviewLayout>
  <Teleport to="body">
    <VuetifyBlurBackground v-if="showEditSecretDialogWith">
      <VuetifyEditSecretDialog :actionType="showEditSecretDialogWith.name ? 'update' : 'create'"
        :name="showEditSecretDialogWith.name" :description="showEditSecretDialogWith.description" :errorMsg="apiError"
        @create="onCreate" @update="updateSecret" @close="showEditSecretDialogWith = undefined" />
    </VuetifyBlurBackground>
    <VuetifyDeleteSecretConfirmation v-if="showDeleteConfirmationOf" :secret-name="showDeleteConfirmationOf"
      @confirm="onSecretDeletion" @close="hideDeleteConfirmation" @cancel="hideDeleteConfirmation" />
  </Teleport>
</template>

<script setup lang="ts">
import { useClipboard, useWindowSize } from '@vueuse/core'
import { computed, defineAsyncComponent, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { SecretPost, SecretUpdate } from '~/api'
import { useDebugMode } from '~/composables/useDebugMode'
import { useSimpleSearch } from '~/composables/useSimpleSearch'
import { useSecretStore } from '~/store/useSecretStore'
import type { SecretMetadata, SelectItem } from '~/types'
import { storeContext } from '~api'
import { useRecentDateFormat, useScrollHighlight } from '~composables'
import { copySecret } from '~helpers'
import { isUnixEpoch } from '~utils'

const VuetifyEditSecretDialog = defineAsyncComponent(
  () => import('~/components/organisms/VuetifyEditSecretDialog.vue'),
)
const showEditSecretDialogWith = ref<Partial<SecretMetadata>>()
const onAddSecret = () =>
  (showEditSecretDialogWith.value = { name: undefined, description: undefined })

const VuetifyDeleteSecretConfirmation = defineAsyncComponent(
  () => import('~/components/organisms/VuetifyDeleteSecretConfirmation.vue'),
)
const showDeleteConfirmationOf = ref<SecretMetadata['name']>()
const hideDeleteConfirmation = () =>
  (showDeleteConfirmationOf.value = undefined)

const EDIT_SECRET_LABEL = 'Update'

const { width: screenWidth } = useWindowSize()

const router = useRouter()

const apiError = ref<string>()
useDebugMode({ errorState: apiError })

const isLoading = ref(true)
const secretStore = useSecretStore(storeContext)
const hasSecret = computed(() => secretStore.secrets.length > 0)
const search = ref('')
const { results: filteredSecrets } = useSimpleSearch({
  candidates: computed(() =>
    secretStore.secrets.map((s) => ({ id: s.name, ...s })),
  ),
  search: search,
  searchIn: ['name', 'description', 'creationTime', 'lastModificationTime'],
})

// ---------
//  Filters
// ---------
const SORT_BY_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'creationTime', label: 'Creation Time' },
  { value: 'lastModificationTime', label: 'Last Modification Time' },
] satisfies SelectItem<keyof SecretMetadata>[]
const showSortBy = ref(false)
const selectedSortBy = computed({
  get() {
    const v = router.currentRoute.value.query['sortBy'] as string
    return SORT_BY_OPTIONS.find((opt) => opt.value === v) ?? SORT_BY_OPTIONS[0]
  },
  set(v) {
    router.replace({ query: { sortBy: v?.value } })
  },
})

/** on sort changes, scroll to top via a component prop  */
const triggerScrollTop = ref(false)
watch(selectedSortBy, (newVal, oldVal) => {
  if (newVal !== oldVal) triggerScrollTop.value = true
})

// ---------------
//  Data fetching
// ---------------
secretStore
  .getSecrets()
  .then((r) => {
    if (!r.ok) apiError.value = r.error.msg
  })
  .finally(() => (isLoading.value = false))

const sortedSecrets = computed(() => {
  const sortBy = selectedSortBy.value.value
  const passParams = <T>(a: T, b: T) => [a, b]
  const swapParams = <T>(a: T, b: T) => [b, a]
  const order = sortBy === 'name' ? passParams : swapParams
  return [...filteredSecrets.value].sort((s1, s2) => {
    const [a, b] = order(s1, s2)
    return a[sortBy].localeCompare(b[sortBy])
  })
})

// ---------
//  Actions
// ---------
const { copy } = useClipboard()
const onSecretCopy = (secretName: string) => copy(copySecret(secretName))

const postSecret = async (secret: SecretPost): Promise<boolean> => {
  if (!secret.secret) {
    apiError.value =
      'The secret value has to be provided in order to create or rename it.'
    return false
  }
  const r = await secretStore.createSecret(secret)
  if (!r.ok) {
    apiError.value = r.error.msg
  }
  return r.ok
}

const { scrollTo } = useScrollHighlight()
const onCreate = async (newSecret: SecretPost) => {
  const isPostSuccessful = await postSecret(newSecret)
  if (isPostSuccessful) {
    showEditSecretDialogWith.value = undefined
    await nextTick()
    scrollTo(`secret-${newSecret.name}`)
  }
}

const updateSecret = async (newSecret: SecretUpdate) => {
  const currentSecret = showEditSecretDialogWith.value
  if (!currentSecret?.name) return
  const result = await secretStore.updateSecret(newSecret, {
    name: currentSecret.name,
  })
  if (result.ok) {
    showEditSecretDialogWith.value = undefined
    apiError.value = undefined
  } else {
    apiError.value = result.error.msg
  }
}

const onSecretDeletion = async () => {
  const secretName = showDeleteConfirmationOf.value
  if (!secretName) return
  const result = await secretStore.deleteSecret(secretName)
  if (result.ok) {
    showDeleteConfirmationOf.value = undefined
    apiError.value = undefined
  } else {
    apiError.value = result.error.msg
  }
}
</script>

<style scoped lang="scss">
.main {
  max-width: 1680px;
}

.search-block {
  margin-top: 20px;
  justify-content: end;
  padding-left: 70%;
  flex-grow: 1;
}

.secret-container {
  display: flex;
  column-gap: #{2* $space-component-l};

  padding: $padding-component-s $padding-component-m;
  // FIXME COLORING: bg-backround turns everything grey here
  background-color: #FFFFFF;
  color: #000000;

  .-dark-mode & {
    background-color: #000000;
    color: #FFFFFF;
  }

  cursor: pointer;

  &:hover,
  &:focus,
  &:focus-within {
    .secret-name {
      color: #1E88E5; // blue-darken-1 FIXME var(--minor-accent__enabled__front__default);

      .-dark-mode & {
        color: #64B5F6; // blue-lighten-2
      }
    }

    .secret-actions {
      visibility: visible;
    }
  }

  >* {
    flex-grow: 1;
  }
}


.smaller {
  font-size: 0.925rem;
}

.secret-texts {
  display: grid;
  grid-template-rows: 1fr 1fr;
  grid-template-columns: auto 1fr;
  column-gap: 8px;
  width: 100%;
  max-width: 296px;

  &>*:first-child {
    grid-area: 1 / 1 / 3 / 1;
    max-width: max-content;
  }
}

@media screen and (min-width: $mdScreenWidth) {
  .secret-texts {
    max-width: 400px;
  }
}

.secret-metadata {
  display: flex;
  flex-direction: column;
  white-space: nowrap;
  width: 100%;
  max-width: 296px;
}

.secret-actions {
  display: flex;
  justify-content: end;
  visibility: hidden;
  gap: 8px;
}

@media screen and (max-width: 1250px) {
  .secret-actions {
    :deep(.v-icon) {
      padding-right: .75rem;
    }

    :deep(.v-btn__content) {
      display: none;
    }
  }
}
</style>
