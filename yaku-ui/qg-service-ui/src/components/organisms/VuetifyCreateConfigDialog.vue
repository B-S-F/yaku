<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <VuetifyBlurBackground>
    <FrogDialog v-bind="$attrs" id="create-config-dialog" :open="showDialog" :maxWidth="maxWidth"
      class="create-config-dialog" @close="emit('close')">
      <template #headline>
        Create Configurations
      </template>
      <template #body>
        <p class="desc">
          Please select one of the following options to create a new configuration:
        </p>
        <ul class="tile-list">
          <li v-for="configStrategy in configStrategies" :key="configStrategy.title">
            <FrogTile tabindex="0" secondary @click="configStrategy.action" @keydown.enter="configStrategy.action">
              <div class="a-text">
                <span class="text-body-2" style="display:block;margin-bottom:0.5rem">
                  {{ configStrategy.subtitle }}
                </span>
                <FrogIcon class="icon" :icon="configStrategy.icon" />
                <!-- 3 rem -->
                <div class="row">
                  <h3 class="text-h6 font-weight-bold" style="margin-bottom:0.5rem;margin-top:0">
                    {{ configStrategy.title }}
                  </h3>
                  <i class="a-icon ui-ic-inline-right-bold" title="inline-right-bold"
                    style="margin-left:0.5rem;font-size:24px;vertical-align:baseline" />
                </div>
                <p class="text-body-1" style="margin:0">
                  {{ configStrategy.text }}
                </p>
              </div>
            </FrogTile>
          </li>
        </ul>
      </template>
      <template #actions>
        <FrogNotificationBar class="notif-bar" :show="!!apiError" type="error" full-width with-icon center-icon
          no-content-margin>
          <VuetifyBannerContent :label="apiError" @close="apiError = undefined" />
        </FrogNotificationBar>
      </template>
    </FrogDialog>
  </VuetifyBlurBackground>
</template>

<script lang="ts" setup>
import { useFileDialog } from '@vueuse/core'
import { computed, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useConfigRawFileGenerator, useUrlContext } from '~/composables'
import { useDebugMode } from '~/composables/useDebugMode'
import { TEMPLATE_EMPTY_YAML_CONFIG } from '~/config/configurationCreation'
import { ROUTE_NAMES } from '~/router'
import type { Config } from '~/types'
import { useApiCore, useApiNetworkError } from '~api'

defineProps<{
  showDialog: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'copy-config'): void
}>()

const router = useRouter()
const { urlContext } = useUrlContext()
const api = useApiCore()
const apiError = ref<string>()
useDebugMode({ errorState: apiError })

const { files, open, reset } = useFileDialog({
  multiple: false,
  accept: '.yml,.yaml',
})

/** if a file is added, then setup and open a new config */
watchEffect(async () => {
  if (files.value && files.value.length > 1) return // TODO: error more than one file provided
  const file = files.value?.item(0)
  if (!file) return // no file selected, assuming the user is cancelling the action do nothing
  const name = file.name.split('.').slice(0, -1).join('.')
  try {
    const rConfig = await api.postConfig({
      name,
      description: '',
    })
    if (!rConfig.ok) {
      // TODO: handle error
      return
    }
    const newConfig = (await rConfig.json()) as Config
    const rFile = await api.postFileInConfig({
      configId: newConfig.id,
      content: file,
      filename: file.name,
    })
    reset()
    if (!rFile?.ok) {
      // TODO: handle error
      return
    }
    router.push({
      name: 'EditConfig',
      params: { ...urlContext.value, id: newConfig.id },
    })
  } catch (err) {
    useApiNetworkError({ redirectWithRouter: useRouter() })
  }
})

const configStrategies = [
  {
    subtitle: 'With template',
    title: 'Start with an existing Excel file',
    text: 'Upload an QG Excel file from your computer to generate a QG configuration YAML and schema file.',
    icon: 'mdi-file-excel-outline',
    action: () =>
      router.push({
        name: ROUTE_NAMES.EXCEL_TO_CONFIG,
        query: { reset: 1 },
        params: {
          ...urlContext.value,
        },
      }),
  },
  {
    subtitle: 'With template',
    title: 'Start with an existing YAML file',
    text: 'Upload a YAML file from your computer that you want to use as QG configuration.',
    icon: 'mdi-file-code-outline',
    action: open, // populate files, the rest is handled by watchEffect
  },
  {
    subtitle: 'With template',
    title: 'Start with an existing Configuration',
    text: 'Copy an existing configuration and adapt all necessary parameters.',
    icon: 'mdi-file-document-outline',
    action: () => emit('copy-config'),
  },
  {
    subtitle: 'Without template',
    title: 'Start with an empty Configuration',
    text: 'Use the editor to create a new individual configuration.',
    icon: 'mdi-code-block-tags',
    action: async () => {
      const file = useConfigRawFileGenerator({
        filename: 'qg-config.yaml',
        rawConfig: TEMPLATE_EMPTY_YAML_CONFIG,
      }).file.value
      const r = await api.postConfig({
        name: 'New Configuration',
        description: '',
      })
      if (!r.ok) {
        // TODO: handle error
        return
      }
      const newConfig = (await r.json()) as Config
      const newFile = await api.postFileInConfig({
        configId: newConfig.id,
        content: file,
        filename: file.name,
      })
      if (!newFile?.ok) {
        // TODO: handle error
        return
      }
      router.push({
        name: ROUTE_NAMES.CONFIG_EDIT,
        params: { ...urlContext.value, id: newConfig.id },
      })
    },
  },
] as const

const { name } = useDisplay()
const maxWidth = computed(() => {
  console.log(name.value)
  switch (name.value) {
    case 'xs':
      return '100%'
    case 'sm':
      return '100%'
    case 'md':
      return '900px'
    case 'lg':
      return '1200px'
    case 'xl':
      return '1400px'
    case 'xxl':
      return '1400px'
  }

  return undefined
})
</script>

<style scoped lang="scss">
@use '../../styles/tokens.scss' as Tokens;

.tile-list {
  display: grid;
  grid-auto-rows: max-content;
  grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
  padding-left: 0;
  column-gap: 32px;

  @media screen and (max-width: Tokens.$bp-max-1020) {
    column-gap: 16px;
  }

  li {
    display: contents;
    padding: 0;
    cursor: pointer;

    &::before {
      display: none;
    }

    .icon {
      font-size: 3em;
    }
  }
}

.a-text {
  padding: 16px;
}

.desc {
  margin-bottom: 40px;
}

.row {
  display: grid;
  grid-template-columns: 1.5fr 1fr;

  &>*:nth-child(2) {
    justify-self: center;
  }
}

.notif-bar {
  width: 100%;
  padding-bottom: 10px;
}
</style>
