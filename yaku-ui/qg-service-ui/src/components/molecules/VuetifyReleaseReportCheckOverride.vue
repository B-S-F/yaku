<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <article class="report-check-override">
    <header class="status bg-grey-lighten-3">
      <h3 class="status-color text-md-body-1 font-weight-bold">
        Manual Status Change: <VuetifyStatusPill v-if="override.manualColor" rounded v-bind="checkOverrideStatus">
          <template #icon>
            <FrogIcon v-if="checkOverrideStatus.icon" :icon="checkOverrideStatus.icon ?? ''" />
            <component :is="checkOverrideStatus.iconComponent" v-else />
          </template>
        </VuetifyStatusPill>{{ textMap.get(override.manualColor as CheckColor)
        }}
      </h3>
      <span class="text-sm-caption">{{ getHumanDateTime(override.lastModificationTime) }}</span>
    </header>
    <main>
      <div v-if="override.comment" class="comment bg-grey-lighten-3">
        <VuetifyMarkdown tag="p" :source="override.comment" />
      </div>
    </main>
  </article>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { ReleaseOverride } from '~/api'
import { getResultPillFromStatus, textMap } from '~/helpers'
import { CheckColor } from '~/types/Release'
import { getHumanDateTime } from '~/utils'

const props = defineProps<{
  override: ReleaseOverride
}>()
const checkOverrideStatus = computed(() =>
  getResultPillFromStatus(props.override.manualColor, true),
)
</script>
<style scoped lang="scss">
@use "../../styles/mixins/flex.scss" as Flex;

.status {
  padding: 8px;
}

.status-color {
  margin: 0;
  @include Flex.flexbox;

  .pill {
    margin-left: $spacing-24;
    margin-right: $spacing-12;
  }
}


.report-check-override main {
  border-top: 1px solid rgb(var(--v-theme-background))
}

.comment {
  padding: 8px;

  :deep(p) {
    margin: 0;
  }
}
</style>
