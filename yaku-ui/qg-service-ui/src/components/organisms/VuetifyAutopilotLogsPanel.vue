<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <VuetifySidePanel class="logs-panel" maximizable resizable position="right" @click-outside="emit('click-outside')"
    @close="emit('close')">
    <header>
      <VuetifyStatusPill rounded v-bind="getResultPillFromStatus(evaluation.status)">
        <template #icon>
          <FrogIcon :icon="getResultPillFromStatus(evaluation.status).icon ?? ''" />
        </template>
      </VuetifyStatusPill>
      <h2 class="title text-h5 font-weight-bold">
        Autopilot {{ evaluation.autopilot }}
      </h2>
    </header>
    <dl class="autopilot-metadata">
      <template v-if="evaluation.reason">
        <dt>
          Reason
        </dt>
        <dd>
          <VuetifyMarkdown tag="div" :source="evaluation.reason" />
        </dd>
      </template>
      <template v-if="evaluation.execution?.logs">
        <dt>Logs</dt>
        <dd>
          <VuetifyLogs class="logs" :logs="evaluation.execution.logs" />
        </dd>
      </template>
      <template v-if="evaluation.execution?.errorLogs">
        <dt>Error logs</dt>
        <dd>
          <VuetifyLogs class="logs" :logs="evaluation.execution?.errorLogs ?? []" />
        </dd>
      </template>
    </dl>
  </VuetifySidePanel>
</template>

<script setup lang="ts">
import type { CheckReport } from '~/helpers'
import { getResultPillFromStatus } from '~/helpers/getPillInfo'

defineProps<{
  evaluation: CheckReport['evaluation']
}>()

const emit = defineEmits<{
  (e: 'click-outside'): void
  (e: 'close'): void
}>()
</script>

<style scoped lang="scss">
.logs-panel {
  --panel-min-width: 250px;
}

header {
  display: flex;
  align-items: center;
  flex-flow: row wrap;
  gap: 0.5rem 1rem;
  margin-bottom: 38px;

  .title {
    margin: 0
  }

  .aqua-link {
    transform: translateY(-1px);
  }
}

.autopilot-metadata {
  overflow-y: auto;
}

dl {
  margin: 0;
  display: flex;
  flex-direction: column;
  row-gap: $space-component-xs;
}

dt {
  font-weight: 600;
}

dd {
  margin-left: 0;
}

dd+dt {
  margin-top: $space-component-m;
}

.status {
  --y-shift: -200%;
  --x-shift: -11px;
}

.logs {
  height: fit-content;
}
</style>
