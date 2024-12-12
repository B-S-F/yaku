<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <main id="use-case-1" class="span-8-center">
    <FrogSteps :active-step="currentStepCount" :steps="STEPS" class="steps" />
    <KeepAlive>
      <component :is="currentView" :error-msg="isErrorStepWithMsg" @next="currentStepCount++" @back="currentStepCount--"
        @error="onError" />
    </KeepAlive>
  </main>
  <Teleport to="#app">
    <ScreenCenter v-if="exitDialog.isRevealed.value">
      <VuetifyCloseExcelToConfigDialog @confirm="exitDialog.confirm()" @abort="exitDialog.cancel()" />
    </ScreenCenter>
  </Teleport>
</template>

<script setup lang="ts">
import { useConfirmDialog, useSessionStorage } from '@vueuse/core'
import { computed, defineAsyncComponent, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import {
  VuetifyMapping,
  VuetifyResultError,
  VuetifyRowSelection,
  VuetifySelectFile,
} from '~/components/organisms/configExcelGenerator'
import { useUrlContext } from '~/composables'
import { ROUTE_NAMES } from '~/router'
import { useWorkbookStore } from '~/store/useWorkbookStore'
import type { Step } from '~/types'

const VuetifyCloseExcelToConfigDialog = defineAsyncComponent(
  () => import('~/components/organisms/VuetifyCloseExcelToConfigDialog.vue'),
)

type HistoryState = { step: number }

const STEPS: Step[] = [
  { label: '1', description: 'Upload File' },
  { label: '2', description: 'Define Content' },
  { label: '3', description: 'Map Columns' },
  { label: '4', description: 'Result' },
]
const STEPS_COMPONENTS = [
  { id: 1, component: VuetifySelectFile },
  { id: 2, component: VuetifyRowSelection },
  { id: 3, component: VuetifyMapping },
  { id: 4, component: VuetifyResultError },
]

const DEFAULT_STEP_COUNT = 1
const DEFAULT_ERROR_STEP = null
const currentStepCount = useSessionStorage('current-step', DEFAULT_STEP_COUNT)
const isErrorStepWithMsg = useSessionStorage<string>(
  'result-error',
  DEFAULT_ERROR_STEP,
)
const currentView = computed(
  () => STEPS_COMPONENTS[currentStepCount.value - 1].component,
)

watch(currentStepCount, (step) => {
  document.body.scroll({ top: 0, behavior: 'smooth' })
  document.documentElement.scroll({ top: 0, behavior: 'smooth' })
  history.pushState({ step } as HistoryState, `Step ${step}`)
})

const router = useRouter()
const exitDialog = useConfirmDialog()
const { urlContext } = useUrlContext()
onBeforeRouteLeave(async (to, from, next) => {
  if (
    to.name !== ROUTE_NAMES.EXCEL_TO_CONFIG &&
    (currentStepCount.value === 2 ||
      (currentStepCount.value === 3 && to.name !== ROUTE_NAMES.CONFIG_EDIT))
  ) {
    const { isCanceled } = await exitDialog.reveal()
    next(!isCanceled)
  } else {
    next()
  }
})

const route = useRoute()
if (route.query['reset']) {
  router.replace({
    name: ROUTE_NAMES.EXCEL_TO_CONFIG,
    params: { ...urlContext.value },
  })
  currentStepCount.value = DEFAULT_STEP_COUNT
  isErrorStepWithMsg.value = DEFAULT_ERROR_STEP
  useWorkbookStore().reset()
}

const onError = (e: string) => {
  isErrorStepWithMsg.value = e
  currentStepCount.value = STEPS_COMPONENTS.length
}
</script>

<style scoped lang="scss">
#use-case-1 {
  padding-top: 76px;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  grid-template-columns: 100%;
}

.steps {
  margin-bottom: 48px;
}

// -----------------------------
//  Global styles for each step
// -----------------------------
:global(#use-case-1 .navigation-buttons) {
  margin-top: 24px;
  display: flex;
  justify-content: space-between;
}

:global(#use-case-1 .step-heading) {
  margin-bottom: 48px;
}
</style>
