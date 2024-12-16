<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <dialog ref="dialogRef" class="test-run-panel bottom dialog-reset" :class="layout" :open="open">
    <div :class="[areFinished ? '--success' : '--info']" />
    <header class="panel-header">
      <FrogIcon :icon="areFinished ? 'mdi-check-circle-outline' : 'mdi-information-outline'" />
      <h1 class="heading text-h5 font-weight-bold">
        Test run {{ areFinished ? 'finished' : 'in progress' }}
      </h1>
      <div class="panel-action-group">
        <FrogButton class="custom-icon-btn" integrated :disabled="layout === 'minimized'" @click="layout = 'minimized'">
          <VuetifyWindowMinimized />
        </FrogButton>
        <FrogButton class="custom-icon-btn" integrated :disabled="layout === 'small'" @click="layout = 'small'">
          <VuetifyWindowSmall />
        </FrogButton>
        <FrogButton class="custom-icon-btn" integrated :disabled="layout === 'maximized' || !areFinished"
          @click="layout = 'maximized'">
          <VuetifyWindowMaximized />
        </FrogButton>
        <FrogButton integrated icon="mdi-close" @click="emit('update:open', false)" />
      </div>
    </header>
    <template v-if="layout !== 'minimized'">
      <ul class="semantic-list test-run-list">
        <li v-for="testRun in sortedTestRuns" :key="testRun.id">
          <section v-if="pill">
            <header>
              <VuetifyStatusPill rounded :color="pill.color" :tooltip="pill.tooltip">
                <template #icon>
                  <FrogIcon v-if="pill.icon" :icon="pill.icon" />
                  <component :is="pill.iconComponent" />
                </template>
              </VuetifyStatusPill>
              <h2 class="text-h6 font-weight-bold heading">
                {{ testRun.check.name }}
              </h2>
            </header>
            <VuetifyLogs v-if="testRun.log" :logs="getCheckLogs(testRun.log, testRun.check.context)" />
          </section>
        </li>
      </ul>
      <footer>
        <VuetifyRuntimeClock v-if="lastTestRun" class="runtime-clock" :run="lastTestRun" />
        <FrogButton v-bind="downloadBtn">
          <VuetifyStack v-slot="{ visibleClass }">
            <span :class="{ [visibleClass]: !isDownloading }">Download evidences</span>
            <span :class="{ [visibleClass]: isDownloading }">Downloading...</span>
          </VuetifyStack>
        </FrogButton>
        <FrogButton secondary :disabled="!lastTestRun || !areFinished" icon="mdi-replay" data-cy="rerun-test-run"
          @click="emit('rerun-test-run', lastTestRun!.check.context)">
          Rerun selected check
        </FrogButton>
      </footer>
    </template>
  </dialog>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import type { SingleCheck } from '~/api'
import { useApiCore } from '~/composables/api'
import type { TestRun } from '~/types'
import { getCheckLogs, getVuetifyRunPillInfo } from '~helpers'

/**
 * A similar component to the SidePanel.vue
 * This one is built only for displaying test runs.
 */

const props = defineProps<{
  open: boolean
  testRuns: [TestRun] | []
}>()

const emit = defineEmits<{
  (e: 'update:open', open: boolean): void
  (e: 'rerun-test-run', payload: SingleCheck): void
}>()

const layout = ref<'minimized' | 'small' | 'maximized'>('small')

const apiCore = useApiCore()
const dialogRef = ref<HTMLDialogElement>()
watchEffect(() => dialogRef.value?.focus(), { flush: 'post' })

const sortedTestRuns = computed(() =>
  [...props.testRuns].sort((a, b) =>
    a.creationTime.localeCompare(b.creationTime),
  ),
)
const lastTestRun = computed(() => sortedTestRuns.value.at(-1))

const pill = computed(() => {
  const testRun = props.testRuns[0]
  return testRun ? getVuetifyRunPillInfo(testRun) : undefined
})

const areFinished = computed(() =>
  props.testRuns.every((r) => r.status !== 'pending' && r.status !== 'running'),
)

const isDownloading = ref(false)

const downloadBtn = computed(() =>
  isDownloading.value
    ? {
        icon: 'refresh',
        class: 'downloading',
      }
    : {
        icon: 'download',
        onClick: async () => {
          if (!lastTestRun.value) return
          isDownloading.value = true
          await apiCore.downloadEvidenceFile({ runId: lastTestRun.value.id })
          isDownloading.value = false
        },
        disabled:
          lastTestRun.value?.status !== 'completed' &&
          lastTestRun.value?.status !== 'failed',
      },
)
</script>

<style scoped lang="scss">
@use "../../styles/tokens.scss" as *;
@use '../../styles/helpers.scss' as *;

dialog.test-run-panel[open] {
  position: fixed;
  width: 100%;
  max-width: 70vw;
  max-height: var(--layout-height);
  padding-bottom: $padding-component-m;

  display: flex;
  flex-direction: column;

  @media screen and (max-width: $bp-max-1020) {
    max-width: calc(100% - 2 * #{$viewPadding});
  }

  // --- Position ---
  &.bottom {
    margin: 0 auto;
    bottom: 0;
  }

  // --- Layout ---
  &.minimized {
    --layout-height: fit-content;
    padding-bottom: 0;

    .panel-header {
      margin-bottom: 0;
    }
  }

  &.small {
    --layout-height: 30vh;
  }

  &.maximized {
    --layout-height: 70vh;
  }

  // --- content layout ---
  >*:not(.m-dialog__remark) {
    padding-left: $padding-component-l;
  }

  >*:not(header, .m-dialog__remark) {
    padding-right: $padding-component-l;
  }

  >.test-run-list {
    flex: 1 1 auto;
  }

  >:not(.test-run-list) {
    flex: 0 0 auto;
  }
}

.panel-header {
  display: flex;
  align-items: center;
  column-gap: 10px;
  border-bottom: 1px solid #616161; // grey-darken-2
  margin-bottom: $space-component-l;
}

.heading {
  margin: 0 auto 0 0;
}

.panel-action-group {
  display: flex;
  column-gap: $space-component-buttonGroup;
}

.custom-icon-btn {
  :deep(.a-button__label) {
    display: flex;
    align-items: end;
  }
}

.test-run-list {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  margin-bottom: $padding-component-m;
  gap: $space-component-s 0;

  header {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    column-gap: $space-component-m;
    margin-bottom: $space-component-s;
  }
}

.runtime-clock {
  display: flex;
  column-gap: $space-component-s;
  align-self: end;
  margin-right: auto;
}

footer {
  display: flex;
  align-items: center;
  column-gap: $space-component-buttonGroup;
}

.hidden {
  visibility: hidden;
}
</style>
