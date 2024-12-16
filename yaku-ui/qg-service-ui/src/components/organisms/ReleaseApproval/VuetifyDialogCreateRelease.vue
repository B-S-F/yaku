<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <VuetifyBlurBackground>
    <FrogDialog v-bind="$attrs" id="createReleaseDialog" title="Create release" open @close="emit('close')">
      <template #body>
        <div class="new-release-form">
          <div class="new-release-form__row">
            <label class="text-h6 font-weight-bold" for="release-name">
              Specify name & Planned date
            </label>
            <v-row>
              <v-col>
                <FrogTextInput id="release-name" v-model="newRelease.name" hideDetails type="text"
                  placeholder="e.g.: Release 2.0" label="Release name" />
              </v-col>
              <v-col cols="4">
                <FrogTextInput id="release-date" v-model="newRelease.plannedDate" hideDetails type="date"
                  placeholder="Selected date" label="Planned release" :min="getEarliestPossibleReleaseDate()" />
              </v-col>
            </v-row>
          </div>
          <div class="new-release-form__row">
            <label class="text-h6 font-weight-bold" for="release-configuration">
              Select a configuration
            </label>
            <FrogDropdown id="release-configuration" label="Configuration" :items="configsOptions"
              :disabled="!configsOptions || !configsOptions.length"
              :model-value="configsOptions.find(c => c.value === newRelease.qgConfigId)"
              @update:model-value="newRelease.qgConfigId = $event.value as number" />
          </div>
          <div class="new-release-form__row">
            <div class="title-hint">
              <label class="text-h6 font-weight-bold" for="release-approvals">
                Assign approvers
              </label>
              <FrogPopover arrowPlacementClass="-without-arrow-top"
                label="Select the respective approvers and they will get notified" trigger-on-hover tooltip-alike
                attached>
                <FrogIcon icon="mdi-information-outline" />
              </FrogPopover>
            </div>
            <FrogDropdown id="add-approver" class="add-approver" :modelValue="{ label: '', value: 'Add approver' }"
              :disabled="!users.length" :items="users" @update:model-value="onSelectApprover($event.value as string)" />
            <ul v-if="releaseApprovers.length" class="semantic-list approvers-list">
              <li v-for="approver in releaseApprovers" :key="approver.id">
                <VuetifyApproverListItem :username="approver.displayName">
                  <template #actions>
                    <FrogButton integrated icon="mdi-delete-outline"
                      @click="handleRemoveSelectedApprover(approver.id)" />
                  </template>
                </VuetifyApproverListItem>
              </li>
            </ul>
          </div>
        </div>
      </template>
      <template #actions>
        <FrogPopover class="testing" arrowPlacementClass="-without-arrow-top"
          label="Please complete all information except for the approver before the release can be created"
          trigger-on-hover tooltip-alike attached :deactivate="!!isValidRelease">
          <FrogButton :disabled="!isValidRelease" @click="handleCreateNewRelease">
            Save
          </FrogButton>
        </FrogPopover>
        <FrogButton secondary @click="emit('close')">
          Cancel
        </FrogButton>
      </template>
    </FrogDialog>
  </VuetifyBlurBackground>
</template>

<script lang="ts" setup>
import { SelectItem } from '@B-S-F/frog-vue'
import { computed, onMounted, reactive, ref } from 'vue'
import { CreateReleasePayload, NamespaceUser, NewReleaseApprover } from '~/api'
import { useConfigsOverviewFetcher } from '~/composables'
import { storeContext, useApiCore } from '~/composables/api'
import { useConfigStore } from '~/store/useConfigStore'
import { Config, Run } from '~/types'
import { getEarliestPossibleReleaseDate } from '~/utils'

const emit = defineEmits<{
  (e: 'close'): void
  (
    e: 'create-release',
    payload: { release: CreateReleasePayload; approvers: NewReleaseApprover[] },
  ): void
}>()

const lastRunOfConfigs = ref<Record<Config['id'], Run | null | undefined>>({})
const findingsOfConfig = ref<Record<Config['id'], { findingCount: number }>>({})

const { all } = useConfigsOverviewFetcher({
  lastRunOfConfigs,
  findingsOfConfig,
})
const { sortedConfigs: configs } = useConfigStore(storeContext)

const configsOptions = computed<SelectItem[]>(() =>
  configs.map((config) => ({
    label: config.name,
    value: config.id,
  })),
)

onMounted(async () => {
  await all({ onlyConfigs: true })
  if (configsOptions.value && !newRelease.qgConfigId) {
    newRelease.qgConfigId = configsOptions.value[0]?.value as number
  }
})

const onSelectApprover = (value: string) => {
  const idx = users.value?.findIndex((u) => u.value === (value as string))
  if (idx === -1) return
  releaseApprovers.value.push({
    id: String(users.value[idx].value),
    displayName: users.value[idx].label,
  })
  // refresh approvers options
  users.value?.splice(idx, 1)
  selectedUser.value = ''
}
const selectedUser = ref<string>('')

const newRelease = reactive<CreateReleasePayload>({
  name: '',
  approvalMode: 'all',
  qgConfigId: null,
  plannedDate: '',
})

const releaseApprovers = ref<{ displayName: string; id: string }[]>([])
const handleRemoveSelectedApprover = (id: string) => {
  const idx = releaseApprovers.value.findIndex((u) => u.id === id)
  if (idx === -1) return
  users.value.push({
    label: releaseApprovers.value[idx].displayName,
    value: releaseApprovers.value[idx].id,
  })
  releaseApprovers.value.splice(idx, 1)
}

const isValidRelease = computed(
  () =>
    newRelease.name.length &&
    !isNaN(new Date(newRelease.plannedDate).getTime()) &&
    newRelease.qgConfigId,
)

const handleCreateNewRelease = () => {
  if (isValidRelease.value) {
    emit('create-release', {
      approvers: releaseApprovers.value.map((a) => ({ id: a.id })),
      release: {
        ...newRelease,
        plannedDate: new Date(newRelease.plannedDate).toISOString(),
      },
    })
  }
}

const { getNamespaceUsers } = useApiCore()
const users = ref<SelectItem[]>([])
onMounted(async () => {
  const r = await getNamespaceUsers()
  if (r.ok) {
    const usersResp = await r.json()
    users.value = usersResp.data.map((u: NamespaceUser) => ({
      label:
        u.displayName && u.displayName !== ' '
          ? u.displayName
          : (u.username ?? u.id),
      value: u.id,
    }))
  }
})
</script>

<style lang="scss" scoped>
@use '../../../styles/helpers.scss' as *;

.new-release-form {
  display: flex;
  flex-direction: column;
  row-gap: $spacing-16;

  &__row {
    display: flex;
    flex-direction: column;
    row-gap: $spacing-16;

    label {
      margin: 0;
    }

    .title-hint {
      display: flex;
      align-items: center;
      column-gap: $spacing-12;

      i {
        vertical-align: bottom;
      }
    }
  }

}

.approvers-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-gap: $spacing-16;
  max-height: 300px;
  overflow-y: auto;


  :deep(.m-approver-item) {
    margin: 0;
  }

  :deep(.m-approver-item .m-approver-item__info) {
    padding: 0 0px 0px 12px;
  }

}

.add-approver {
  :deep(.v-select__menu-icon) {
    transform: none;
  }

  :deep(.v-icon::before) {
    content: "\F0349";
  }
}
</style>
