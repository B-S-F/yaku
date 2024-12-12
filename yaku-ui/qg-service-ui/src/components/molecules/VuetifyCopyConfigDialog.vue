<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <VuetifyBlurBackground>
    <FrogDialog v-bind="$attrs" id="copy-config-dialog" open class="copy-config-dialog"
      title="Copy existing Configuration" @close="emit('close')">
      <template #body>
        <div class="copy-config-dialog__body">
          <div class="copy-config-dialog__row">
            <label v-if="!preSelectedConfigName" class="text-body-1" for="selected-configuration">Select a config you
              want to copy.</label>
            <FrogTextInput v-if="preSelectedConfigName" id="config-name" v-model="preSelectedConfigName"
              label="Source configuration*" type="text" class="flex-1" :readonly="preSelectedConfigName" />
            <FrogDropdown v-else id="selected-configuration" label="Source configuration*" :items="configsOptions"
              :disabled="!configsOptions || !configsOptions.length"
              :model-value="configsOptions.find(c => c.value === newConfigMeta.configId)"
              @update:model-value="handleSetConfigId" />
          </div>
          <div class="copy-config-dialog__row">
            <FrogTextInput id="config-name" v-model="newConfigMeta.name" label="New configuration*" type="text"
              class="flex-1" placeholder="Config-Name_test-copy" />
          </div>
          <div class="copy-config-dialog__row">
            <FrogTextarea id="config-description" v-model="newConfigMeta.description" label="Description" />
          </div>
        </div>
      </template>
      <template #actions>
        <FrogNotificationBar v-if="apiError" :show="!!apiError" variant="bar" type="error" full-width with-icon
          center-icon no-content-margin>
          <VuetifyBannerContent :label="apiError" @close="apiError = undefined" />
        </FrogNotificationBar>
        <FrogPopover arrowPlacementClass="-without-arrow-top"
          label="Please complete all information except for the approver before the release can be created" attached
          triggerOnHover tooltipAlike :deactivate="!!isValidForm">
          <FrogButton :disabled="!isValidForm" @click="handleCopyConfig">
            Create copy
          </FrogButton>
        </FrogPopover>
        <FrogButton secondary @click="emit('close')">
          Cancel
        </FrogButton>
      </template>
    </FrogDialog>
  </VuetifyBlurBackground>
</template>
<script setup lang="ts">
import { SelectItem } from '@B-S-F/frog-vue'
import FrogButton from '@B-S-F/frog-vue/src/atoms/FrogButton.vue'
import FrogPopover from '@B-S-F/frog-vue/src/molecules/FrogPopover.vue'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref } from 'vue'
import { ApiError } from '~/api'
import { storeContext, useApiCore, useApiNetworkError } from '~/composables/api'
import { useConfigStore } from '~/store/useConfigStore'

const props = defineProps<{
  configId?: number
}>()
const emit = defineEmits<(e: 'close', id?: number) => void>()
const configStore = useConfigStore(storeContext)
const { configs } = storeToRefs(configStore)
const configsOptions = computed<SelectItem[]>(() =>
  configs.value.map((config) => ({
    label: config.name,
    value: config.id,
  })),
)
const preSelectedConfigName = computed<string | undefined>(() =>
  props.configId ? configStore.getById(props.configId)?.name : undefined,
)

const newConfigMeta = ref<{
  configId?: number
  name: string
  description: string
}>({ name: '', description: '' })

onMounted(async () => {
  if (props.configId) {
    newConfigMeta.value.configId = props.configId
    const config = await configStore.getOrFetch(props.configId)
    if (config.resource) {
      newConfigMeta.value.name = config.resource.name
        ? `${config.resource.name}-Copy`
        : ''
      newConfigMeta.value.description = config.resource.description ?? ''
    }
  }
})

const isValidForm = computed(
  () => !!newConfigMeta.value.configId && !!newConfigMeta.value.name,
)

const apiCore = useApiCore()
const apiError = ref<string>()

const handleCopyConfig = async () => {
  try {
    if (newConfigMeta.value.configId && newConfigMeta.value.name) {
      const r = await apiCore.copyConfig({
        configId: newConfigMeta.value.configId,
        payload: {
          name: newConfigMeta.value.name,
          description:
            newConfigMeta.value.description &&
            newConfigMeta.value.description.length
              ? newConfigMeta.value.description
              : undefined,
        },
      })
      if (!r.ok) {
        apiError.value = ((await r.json()) as ApiError).message
      }
      const data = await r.json()
      if (data.id) {
        await configStore.getOrFetch(Number(data.id))
      }
      emit('close', data.id)
    }
  } catch {
    apiError.value = useApiNetworkError()
  }
}

const handleSetConfigId = async (e: SelectItem) => {
  if (e.value) {
    newConfigMeta.value.configId = Number(e.value)
    const matchingConfig = await configStore.getOrFetch(Number(e.value))
    if (matchingConfig.resource) {
      newConfigMeta.value.name = matchingConfig.resource?.name
        ? `${matchingConfig.resource?.name}-Copy`
        : ''
      newConfigMeta.value.description =
        matchingConfig.resource.description ?? ''
    }
  }
}
</script>
<style scoped lang="scss">
@use '../../styles/mixins/flex.scss' as Flex;

.-no-margin {
  margin: 0;
}

.copy-config-dialog {
  &__body {
    @include Flex.flexbox($direction: column, $align: stretch);
    row-gap: 16px;
  }

  &__row label {
    display: inline-block;
    margin-bottom: 16px;
  }
}
</style>
