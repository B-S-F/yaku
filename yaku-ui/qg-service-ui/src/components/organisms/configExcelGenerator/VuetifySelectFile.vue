<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div id="select-file">
    <VuetifyStepHeading class="step-heading" heading="Upload your Excel-Sheet" description="Drop the Excel file you want to use for the automated QG-config and schema generation below or choose it from
        your computer." />
    <FrogFileUpload class="file-upload" :file-label="fileUploadLabel" :has-file="files.length > 0"
      :accept="ACCEPTED_FILE_FORMAT" @add="addFiles" @addNotSupported="onAddError" @remove="removeFile(files[0])" />
    <FrogButton :disabled="!enableNextStep" class="next-button" icon="forward-right" icon-right @click="onNext">
      Upload File
    </FrogButton>
  </div>
  <Teleport to="#app">
    <FrogNotificationBar :show="!!apiError" type="error" variant="banner" with-icon no-content-margin full-width>
      <VuetifyBannerContent :label="apiError" @close="apiError = undefined" />
    </FrogNotificationBar>
    <VuetifyProcessingActionIndicator v-show="selectFileState === 'uploading'" isIndeterminate
      label="File is uploading" />
  </Teleport>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onDeactivated, ref, watch, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import {
  ACCEPTED_FILE_FORMAT,
  TEMPLATE_EMPTY_YAML_CONFIG,
} from '~/config/configurationCreation'
import { useWorkbookStore } from '~/store/useWorkbookStore'
import type { Config } from '~/types'
import { useApiCore, useApiNetworkError } from '~api'
import {
  useConfigRawFileGenerator,
  useDebugMode,
  useFileList,
} from '~composables'
import { provideRequestError } from '~helpers'

const emit = defineEmits<(e: 'next') => void>()

const { workbook, file, relatedConfig } = storeToRefs(useWorkbookStore())
const { files, addFiles, removeFile, wb } = useFileList({ file })

const api = useApiCore()
const apiError = ref<string>()
useDebugMode({ errorState: apiError })
onDeactivated(() => (apiError.value = undefined))
const onAddError = () =>
  (apiError.value =
    'This file format is not an Excel file and is not supported.')

const fileUploadLabel = computed(() =>
  files.value.length < 1 ? 'Drop file to upload' : files.value[0].name,
)
const enableNextStep = computed(() => files.value.length > 0)

type SelectFileState = 'idle' | 'uploading'
const selectFileState = ref<SelectFileState>('idle')
// TODO: set workbook depending of the file
watch(wb, () => (workbook.value = wb.value))
watchEffect(() => {
  file.value = files.value[0]
})

const router = useRouter()
const onNext = async () => {
  selectFileState.value = 'uploading'
  try {
    const r = await api.postConfig({
      name: file.value?.name.split('.').slice(0, -1).join('') ?? '',
      description: '',
      fetchInit: {
        signal: AbortSignal.timeout(3000),
      },
    })
    if (r.ok || relatedConfig.value) {
      const config = (await r.json()) as Config
      relatedConfig.value = config
      const r2 = await putDefaultConfigFile(config.id)
      if (r2?.ok) {
        selectFileState.value = 'uploading'
        emit('next')
      } else {
        // assuming users that can create a file have permission to put a file in this config
        apiError.value = await provideRequestError(r2)
      }
    } else if (r.status === 401 || r.status === 403) {
      router.push({ name: 'PermissionError' })
    } else {
      apiError.value = await provideRequestError(r)
    }
  } catch (e) {
    apiError.value = useApiNetworkError()
  } finally {
    selectFileState.value = 'idle'
  }
}

/**
 * meant to be used in onNext function only.
 * The placeholder file is replaced with the generated one in the 3. (Mapping) step.
 */
const putDefaultConfigFile = async (configId: number) => {
  const { file } = useConfigRawFileGenerator({
    filename: 'qg-config.yaml',
    rawConfig: TEMPLATE_EMPTY_YAML_CONFIG,
  })
  try {
    const r = await api.postFileInConfig({
      configId,
      filename: file.value.name,
      content: file.value,
    })
    return r
  } catch (e: any) {
    throw new Error(e) // delegate to upper function
  }
}
</script>

<style scoped lang="scss">
#select-file {
  display: grid;
  grid-template-rows: auto minmax(auto, 520px) 1fr;
  height: 100%;
}

.file-upload {
  min-height: 330px;
  max-height: 520px;
}

.next-button {
  margin-top: 24px;
  height: fit-content;
  justify-self: end;
  align-self: start;
}
</style>
