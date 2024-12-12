<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <VuetifyStatusPill rounded :color="pill.color" :tooltip="pill.tooltip" :title="pill.label">
    <template #icon>
      <FrogIcon v-if="pill.icon" :icon="pill.icon" />
      <component :is="pill.iconComponent" />
    </template>
  </VuetifyStatusPill>
  <div class="result-description md-comment">
    <VuetifyMarkdown tag="span" class="font-weight-bold" :source="result.criterion" />
    <VuetifyMarkdown tag="p" :source="result.justification" />
  </div>
  <div class="result-actions">
    <VuetifyPopoverInfo class="result-metadata-toggle" :triggerOnHover="false" label=""
      arrowPlacementClass="-right-center">
      <template #content>
        <VuetifyResultMetadata :result="result" />
      </template>
    </VuetifyPopoverInfo>
    <!-- A simple finding link -->
    <FrogPopover :label="finding ? resolveFinding === 'dialog' ? 'Finding details' : 'Go to finding' : 'No finding'"
      attached triggerOnHover tooltipAlike arrowPlacementClass="-without-arrow-top">
      <FrogButton v-if="resolveFinding === 'dialog'" integrated icon="mdi-pencil-outline" :disabled="!finding"
        @click.stop="finding && emit('resolveFinding', finding)" />
      <RouterLink v-else class="transparent-link finding-link" :class="{ 'disabled': !finding }"
        :to="!finding ? {} : { name: ROUTE_NAMES.FINDING_RESULTS, params: { ...urlContext, id: finding?.id } }">
        <FrogIcon icon="mdi-arrow-top-right" />
      </RouterLink>
    </FrogPopover>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUrlContext } from '~/composables'
import { getCheckStatusPill, getVuetifyFindingStatusPill } from '~/helpers'
import { isAutoResolved } from '~/helpers/checkResolversName'
import { ROUTE_NAMES } from '~/router'
import type { Finding } from '~/types'
import type { Result } from '~/types/RunResult'

const props = defineProps<{
  status: 'check' | 'finding'
  result: Result
  finding?: Finding
  resolveFinding?: 'dialog' | 'redirect'
}>()

const emit = defineEmits<(e: 'resolveFinding', finding: Finding) => void>()

const { urlContext } = useUrlContext()
const pill = computed(() =>
  props.status === 'finding' && props.finding?.status
    ? getVuetifyFindingStatusPill(
        props.finding?.status,
        isAutoResolved(props.finding?.resolver!),
      )
    : getCheckStatusPill(props.result.fulfilled),
)
</script>

<style scoped lang="scss">
@use '../../styles/components/summary-of-checks';

.severity {
  padding: $padding-component-xxs 0;
}

.result-actions {

  .result-metadata-toggle,
  .finding-link {
    display: flex;
    align-items: center;
    height: 100%;
  }

  .finding-link {
    padding: $space-component-m;
  }

  .finding-link.disabled {
    color: #979ea4;
  }

  .result-metadata-toggle {
    &>:deep(i) {
      padding: $space-component-m;
    }
  }

  .result-metadata-toggle {

    &:hover,
    &:focus-visible,
    &:focus-within {
      > :deep(i) {
        color: #007bc0;
      }
    }
  }
}

// update tooltip styles
:deep([data-tooltip]::before) {
  left: -0.5rem;
  text-align: center;
}

.result-description {
  display: flex;
  flex-direction: column;
  row-gap: $space-component-xs;
  flex-grow: 1;
  margin-inline: $space-component-m;
  @import '../../styles/components/run-report-md-format';
}

.result-actions {
  display: flex;
  align-items: center;
  height: fit-content;
}
</style>
