<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <VuetifyBlurBackground>
    <FrogDialog v-bind="$attrs" id="quickstartup-dialog" :open="showDialog" class="test-run-dialog"
      @close="emit('close')">
      <template #headline>
        Start Test Run
      </template>
      <template #body>
        <p class="desc">
          Please fill the required informations to create a new configuration
        </p>
        <form class="form">
          <FrogTextInput id="url" v-model="form.url" type="url" label="Github URL" data-cy="url-input" />
          <FrogTextInput id="api-secret" v-model="form.token" type="password" label="API Secret"
            data-cy="secret-input" />
        </form>
      </template>
      <template #actions>
        <FrogNotificationBar class="notif-bar" :show="!!apiError" type="error" full-width with-icon center-icon
          no-content-margin data-cy="error-banner">
          <BannerContent :label="apiError" :is-toast="false" @close="apiError = undefined" />
        </FrogNotificationBar>
        <FrogButton class="action" :disabled="isActionDisabled" data-cy="quickstartup-submit" @click="onCreate">
          Create Test Run
        </FrogButton>
      </template>
    </FrogDialog>
  </VuetifyBlurBackground>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUrlContext } from '~/composables'
import { useDebugMode } from '~/composables/useDebugMode'
import { MAIN_CONFIG_FILE } from '~/config/editor'
import quickStartupConfig from '~/config/quick-startup-config.yaml?raw'
import { provideRequestError } from '~/helpers'
import { ROUTE_NAMES } from '~/router'
import { useConfigStore } from '~/store/useConfigStore'
import { useSecretStore } from '~/store/useSecretStore'
import type { Config } from '~/types'
import { getFileObject } from '~/utils'
import { parseGithubUrl } from '~/utils/parseGithubUrl'
import { storeContext, useApiCore } from '~api'

defineProps<{
  showDialog: boolean
}>()

const emit = defineEmits<(e: 'close') => void>()

const router = useRouter()
const { urlContext } = useUrlContext()
const api = useApiCore()
const apiError = ref<string>()
const configStore = useConfigStore(storeContext)
const secretStore = useSecretStore(storeContext)
useDebugMode({ errorState: apiError })

const form = reactive({
  url: '',
  token: '',
})

const isActionDisabled = computed(() =>
  Object.values(form).some((v) => v === ''),
)

const onCreate = async () => {
  const inputs = parseGithubUrl(form.url)
  if (!inputs.ok) {
    apiError.value = inputs.message
    return
  }
  const basename = `${inputs.org}/${inputs.project}`
  const tokenName = `${inputs.org}-${inputs.project}-git-token`
    .replaceAll('-', '_')
    .toUpperCase()

  // 1. Set the secret
  const secretOp = await secretStore.createSecret({
    name: tokenName,
    secret: form.token,
  })
  if (!secretOp.ok) {
    // reuse the secret if the name is already used, so do not return in this specific case
    if (
      secretOp.error.status !== 400 &&
      secretOp.error.msg !==
        'Secret with this name already exists, use PATCH to change'
    )
      return
    apiError.value = secretOp.error.msg
  }
  // 2. Create the configuration
  const configurationName = `${basename} Vulnerability scan`
  const configFileContent = quickStartupConfig
    .replace('%CONFIG_NAME%', configurationName)
    .replace('%GIT_TOKEN%', tokenName)
    .replace('%GIT_REPO_URL%', inputs.repositoryUrl)

  const rConfig = await api.postConfig({
    name: configurationName,
  })
  if (!rConfig.ok) {
    apiError.value = await provideRequestError(rConfig)
    return
  }
  const config = (await rConfig.json()) as Config

  // 3. Attach the generated config file
  const file = { content: configFileContent, filename: MAIN_CONFIG_FILE }
  const rFile = await api.postFileInConfig({
    configId: config.id,
    content: getFileObject(file),
    filename: MAIN_CONFIG_FILE,
  })
  if (!rFile?.ok) {
    apiError.value = await provideRequestError(rFile)
    return
  }
  const qgConfig = rFile.headers.get('location') as string

  // 4. Start the run
  const rRun = await api.postRun({ configId: config.id })
  if (!rRun.ok) {
    apiError.value = await provideRequestError(rRun)
    return
  }

  // 5. Update state and redirect
  configStore.push([
    {
      ...config,
      files: {
        qgConfig,
      },
    },
  ])

  router.push({ name: ROUTE_NAMES.RUNS_OVERVIEW, params: urlContext.value })
}
</script>

<style scoped lang="scss">
#test-run-dialog {
  --max-dialog-width: 1118px;
}

.desc {
  margin-bottom: $spacing-64;
}

.form {
  display: flex;
  flex-direction: column;
  row-gap: $space-elements;
}

.notif-bar {
  width: 100%;
  padding-bottom: 10px;
}

.action {
  margin-top: $space-component-m;
}
</style>
