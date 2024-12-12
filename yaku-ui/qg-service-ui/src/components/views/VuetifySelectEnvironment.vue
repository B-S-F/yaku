<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <main style="border: 10px solid red;">
    <VuetifyEmptyState2 class="empty-state-illustration" />
    <VuetifyBlurBackground>
      <VuetifyScreenCenter>
        <FrogDialog v-bind="$attrs" id="quickstartup-dialog" open class="test-run-dialog" hideCloseBtn hideHeader>
          <template #body>
            <h2 class="heading text-h5 font-weight-bold">
              Please select an environment to get started
            </h2>
            <FrogDropdown id="sheetButtonDropdown" v-model="selectedEnvironment" :items="serverOptions"
              :disabled="!serverOptions.length" @update:model-value="clearError" />
            <FrogNotificationBar :show="!!apiError" variant="text" type="error" full-width with-icon center-icon
              no-content-margin>
              <VuetifyBannerContent :label="apiError" @close="clearError" />
            </FrogNotificationBar>
          </template>

          <template #actions>
            <FrogButton primary
              @click="async () => selectedEnvironment && await selectEnvironment(selectedEnvironment.value)">
              Confirm
            </FrogButton>
          </template>
        </FrogDialog>
      </VuetifyScreenCenter>
    </VuetifyBlurBackground>
  </main>
</template>

<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, getCurrentInstance, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VuetifyEmptyState2 from '~/icons/VuetifyEmptyState2.vue'
import { ACTIVE_ENV_KEY, KEYCLOAK_CONNECT_ERROR } from '~/main'
import { switchEnvironment } from '~/router/utils'
import useEnvsStore from '~/store/useEnvsStore'

const environmentsStore = useEnvsStore()
const { environments, fallbackEnvironment } = storeToRefs(environmentsStore)

onMounted(async () => await environmentsStore.getEnvironments())

const serverOptions = computed<{ label: string; value: string }[]>(() =>
  environments.value.map((s) => {
    return {
      label: s.label,
      value: s.slug,
    }
  }),
)

const fallbackOption = computed(() =>
  serverOptions.value.find((s) => s.value === fallbackEnvironment.value),
)

const selectedEnvironment = ref<{ label: string; value: string }>(
  fallbackOption.value ? fallbackOption.value : serverOptions?.value[0],
)
const setActiveEnvironment = useLocalStorage<string | undefined>(
  ACTIVE_ENV_KEY,
  undefined,
)

watch(serverOptions, (filled) => {
  if (filled.length && !selectedEnvironment.value)
    selectedEnvironment.value = filled[0]
})
const app = getCurrentInstance()

const route = useRoute()
const router = useRouter()
const errorFromParams = route.query?.errors
  ? 'Cannot connect to this environment. Select a different environment'
  : app?.appContext.config.globalProperties.$keycloakError

const apiError = ref<string>(errorFromParams ?? '')
const selectEnvironment = async (env: string) => {
  const matchingEnv = environments.value.find(({ slug }) => slug === env)
  if (matchingEnv) {
    setActiveEnvironment.value = JSON.stringify(matchingEnv)
    localStorage.setItem(ACTIVE_ENV_KEY, JSON.stringify(matchingEnv))
    switchEnvironment(router, matchingEnv?.slug)
  }
}

const clearError = () => {
  apiError.value = ''
  localStorage.removeItem(KEYCLOAK_CONNECT_ERROR)
}
</script>

<style lang="scss">
main {
  padding: 2vh 2vw;
}

.empty-state-illustration {
  height: 100vh;
}
</style>
