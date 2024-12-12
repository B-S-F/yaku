<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <VuetifySidePanel class="logs-panel bg-white" maximizable resizable position="right"
    @click-outside="emit('click-outside')">
    <header>
      <VuetifyRunStatus class="status" :state="run" />
      <h2 class="title text-h5 font-weight-bold">
        #{{ run.id }}
      </h2>
      <span v-if="run.status === 'completed' && run.creationTime">
        | {{ useRecentDateFormat(new Date(run.creationTime)) }}
      </span>
      <RouterLink v-if="config.id && config.name" class="aqua-link font-weight-bold"
        :to="{ name: 'EditConfig', params: { ...urlContext, id: config.id } }">
        <span :data-placeholder="config.name">{{ config.name }}</span>
      </RouterLink>
    </header>
    <VuetifyLogs class="logs bg-grey-lighten-4" withLineNumber :logs="run.log ?? []" />
  </VuetifySidePanel>
</template>

<script setup lang="ts">
import { useRecentDateFormat, useUrlContext } from '~/composables'
import type { Run } from '~/types'

defineProps<{
  config: {
    id?: number | string
    name?: string
  }
  run: Run
}>()

const emit = defineEmits<(e: 'click-outside') => void>()

const { urlContext } = useUrlContext()
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

.status {
  --y-shift: -200%;
  --x-shift: -11px;
}

.logs {
  height: fit-content;
}
</style>
