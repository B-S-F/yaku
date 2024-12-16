<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<!-- eslint-disable vue/no-v-html -->
<template>
  <article class="report-check-finding bg-background">
    <header v-if="finding">
      <h2 v-if="finding.criterion" class="text-md-subtitle-1 font-weight-bold">
        {{ index }} {{ finding.criterion }}
      </h2>
    </header>
    <main>
      <ul class="semantic-list finding-generic-data">
        <li v-if="finding.status" class="item">
          <h3>State</h3>
          <div>
            <VuetifyStatusPill v-if="statusPill" rounded :color="statusPill.color" :tooltip="statusPill.tooltip"
              :label="statusPill.label" class="finding-status">
              <template #icon>
                <FrogIcon v-if="statusPill.icon" :icon="statusPill.icon" />
                <component :is="statusPill.iconComponent" />
              </template>
            </VuetifyStatusPill>
          </div>
        </li>
        <li class="item">
          <h3>
            {{ finding.occurrenceCount > 1 ? "Occurrences" : "Occurrence" }}
          </h3>
          <div>
            <span>{{ finding.occurrenceCount }}</span>
          </div>
        </li>
        <li v-if="getResolversName(finding.resolver)" class="item">
          <h3>Resolved by</h3>
          <span>{{ getResolversName(finding.resolver) }}</span>
        </li>
        <li v-if="finding.resolvedDate" class="item">
          <h3>Resolution date</h3>
          <span>{{
            getHumanDateTime(new Date(finding.resolvedDate)) ?? "-"
            }}</span>
        </li>
      </ul>
      <ul class="semantic-list finding-comments">
        <li v-if="finding.justification" class="item">
          <h3>Justification</h3>
          <VuetifyMarkdown ref="descriptionRef" class="description" tag="span" :source="content" />
        </li>
        <li v-if="finding.status === 'resolved' && finding.resolvedComment" class="item">
          <h3>Resolve Comment</h3>
          <VuetifyMarkdown tag="p" class="resolved-comment" :source="finding.resolvedComment" />
        </li>
      </ul>
    </main>
  </article>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import useResolveFinding from '~/composables/useResolveFinding'
import { getVuetifyFindingStatusPill } from '~/helpers'
import { isAutoResolved } from '~/helpers/checkResolversName'
import { Finding } from '~/types'
import { getHumanDateTime } from '~/utils'
const props = defineProps<{
  index: number
  finding: Finding
}>()
const statusPill = computed(() =>
  getVuetifyFindingStatusPill(
    props.finding.status,
    isAutoResolved(props.finding.resolver),
  ),
)
const content = computed(() => props.finding.justification)
const { getResolversName } = useResolveFinding(ref<Finding>())
</script>
<style scoped lang="scss">
@use "../../styles/mixins/flex.scss" as Flex;

.report-check-finding {
  display: flex;
  flex-direction: column;
  row-gap: 28px;
  min-height: 0;
  padding: 16px 16px 24px 16px;
  overflow-y: auto;
}

header {
  display: flex;
  column-gap: 20px;
  align-items: center;

  h2 {
    margin: 0;
  }
}

.heading {
  margin: 0;
  font-size: 1.5rem;
}

.date {
  margin-left: auto;
  white-space: nowrap;
}

main {
  display: flex;
  flex-direction: column;
  row-gap: 24px;
}

.finding-generic-data,
.finding-metadata {
  display: flex;
  flex-wrap: wrap;
  column-gap: 64px;
  row-gap: 32px;
}

.accordion-metadata {
  border-bottom: 0.0625rem solid #616161; // grey-darken-2
}

.icon {
  width: 1.5em;
}

.item,
.resolver-comment {
  display: flex;
  flex-direction: column;
  row-gap: 8px;

  >div {
    display: flex;
    column-gap: 8px;
  }

  >h3 {
    margin: 0;
    font-size: 1em;
  }
}

.item {
  .description {
    word-break: break-all;

    // markdown styles
    & :deep(*) {
      @import "../../styles/components/run-report-md-format";

      &:first-child {
        margin-top: 0;
      }

      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}

.resolved-comment> :deep(p) {
  margin: 0;
}

.finding-generic-data .pill.rounded.finding-status {
  padding-right: 16px;
}

.finding-comments {
  @include Flex.flexbox($direction: column, $align: stretch);
  row-gap: 24px;

  li:not(:last-child) {
    padding-bottom: 24px;
    border-bottom: 0.0625rem solid #616161; // grey-darken-2
  }
}
</style>
