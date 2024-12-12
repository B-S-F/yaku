<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <main>
    <section class="report-meta">
      <h2 class="report-section-heading text-xl-h5 font-weight-bold">
        Details Report
      </h2>
      <div class="meta">
        <VuetifyReleaseReportMeta header-icon="mdi-cube-outline" title="Release" :info="releaseMetaInfo" />
        <VuetifyReleaseReportMeta header-icon="mdi-nut" title="Configuration" :info="configMetaInfo" />
        <VuetifyReleaseReportMeta header-icon="mdi-play-outline" title="Run" :info="runMetaInfo" />
      </div>
    </section>
    <section v-if="statusPill">
      <h2 class="report-section-heading text-xl-h5 font-weight-bold">
        Overall status
      </h2>
      <div class="overall-status">
        <VuetifyStatusPill rounded v-bind="statusPill" :label="undefined">
          <template #icon>
            <component :is="statusPill.iconComponent" v-if="statusPill.iconComponent" />
            <FrogIcon v-else :icon="statusPill.icon" />
          </template>
        </VuetifyStatusPill>
        <h5 v-if="report?.overallRunResult" class="-no-extra-margin">
          {{ textMap.get(report?.overallRunResult as CheckColor) }}
        </h5>
      </div>
    </section>
    <section class="report-status">
      <h2 class="report-section-heading text-xl-h5 font-weight-bold ">
        Check results
      </h2>
      <div class="results-answered">
        <p class="row">
          Result of answered: <span class="status-bg-dot status-bg--green" /> <span>{{
            `${green ?? '-%'}`
            }}</span> <span class="status-bg-dot status-bg--yellow" /> <span>{{
              `${yellow ?? '-%'}`
            }}</span> <span class="status-bg-dot status-bg--red" /> <span>{{
              `${red ?? '-%'}`
            }}</span> <span class="status-bg-dot status-bg--na" /> <span>{{
              `${na ?? '-%'}`
            }}</span>
        </p>
        <div class="row blocks row-answered">
          <div v-if="showBlock(green)" class="status-bg-block status-bg--green" />
          <div v-if="showBlock(yellow)" class="status-bg-block status-bg--yellow" />
          <div v-if="showBlock(red)" class="status-bg-block status-bg--red" />
          <div v-if="showBlock(na)" class="status-bg-block status-bg--na" />
        </div>

        <div class="row blocks">
          <div v-if="showBlock(automatic)" class="status-bg-block status-bg--automatic" />
          <div v-if="showBlock(manual)" class="status-bg-block status-bg--manual" />
          <div v-if="showBlock(unanswered)" class="status-bg-block status-bg--unanswered" />
        </div>

        <p class="row">
          Answered: <span class="status-bg-dot status-bg--automatic" /> <span>{{
            `${automatic ?? '-%'} Automatically`
          }}</span> <span class="status-bg-dot status-bg--manual" /> <span>{{
              `${manual ?? '-%'} Manually`
            }}</span> <span class="status-bg-dot status-bg--unanswered" /> <span>{{
              `${unanswered ?? '-%'} Unanswered`
            }}</span>
        </p>
      </div>
    </section>
    <section v-if="report?.approvers && report.approvers.length > 0" class="report-approval">
      <h2 class="report-section-heading text-xl-h5 font-weight-bold">
        Release Approval
      </h2>
      <div v-for="approver in report?.approvers" :key="approver.approver.id" class="approval">
        <VuetifyApproverListItem :username="displayUserName(approver.approver)" />
        <VuetifyApproverStatus :state="approver.status" />
        <div v-if="approver.comment" class="report-approver-comment bg-grey-lighten-3">
          <VuetifyMarkdown tag="p" :source="approver.comment" />
        </div>
      </div>
    </section>
    <section class="report-comments">
      <h2 class="report-section-heading text-xl-h5 font-weight-bold">
        Release Comments
      </h2>
      <VuetifyCommentsThread v-for="thread in report?.comments" :key="thread.id" :thread="thread" no-reply read-only />
    </section>
    <section class="report-views">
      <h2 class="report-section-heading text-xl-h5 font-weight-bold">
        Release View
      </h2>
      <VuetifyReleaseReportChecksSummary v-if="report?.chapters" :content-items="report.chapters"
        heading-label="Requirements and Checks" heading-tag="h3" />
    </section>
  </main>
</template>
<script setup lang="ts">
import { computed, onBeforeMount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getVuetifyRunPillFromOverallResult, textMap } from '~/helpers'
import { displayUserName } from '~/helpers/displayUserName'
import useReleaseReportStore from '~/store/useReleaseReportStore'
import { ReleaseReport } from '~/types/ReleaseReport'
import { getHumanDateTime } from '~/utils'
import { CheckColor } from '../../types/Release'

const reportStore = useReleaseReportStore()
const report = ref<ReleaseReport>()
const route = useRoute()

onBeforeMount(() => {
  // Print on white bg without changing the color scheme of the application
  if (document.body.classList.contains('-dark-mode')) {
    document.body.classList.remove('-dark-mode')
  }
})
onMounted(async () => {
  const findReport = await reportStore.getReport(
    Number(route.params.id as string),
  )
  if (findReport.ok) {
    report.value = findReport.resource
  }
})

const releaseMetaInfo = computed(() => [
  {
    title: 'Name',
    description: report.value?.releaseMeta?.name ?? '-',
  },
  {
    title: 'Date',
    description: report.value?.releaseMeta?.date
      ? getHumanDateTime(report.value.releaseMeta.date)
      : '-',
  },
])

const configMetaInfo = computed(() => [
  {
    title: 'Name',
    description: report.value?.configMeta?.name ?? '-',
  },
  {
    title: 'Date',
    description: report.value?.configMeta?.date
      ? getHumanDateTime(report.value.configMeta.date)
      : '-',
  },
])

const runMetaInfo = computed(() => [
  {
    title: 'Number',
    description: String(report.value?.runMeta?.id) ?? '-',
  },
  {
    title: 'Date',
    description: report.value?.runMeta?.date
      ? getHumanDateTime(report.value.runMeta.date)
      : '-',
  },
])

const getCheckSummaryColorWidth = (color: 'RED' | 'GREEN' | 'YELLOW' | 'NA') =>
  computed(() => `${report.value?.checksSummary[color]}%`)

const yellow = getCheckSummaryColorWidth('YELLOW')
const na = getCheckSummaryColorWidth('NA')
const green = getCheckSummaryColorWidth('GREEN')
const red = getCheckSummaryColorWidth('RED')

const getCheckAnswerDistributionWidth = (
  color: 'automatic' | 'unanswered' | 'manual',
) => computed(() => `${report.value?.checksAnswersDistribution[color]}%`)

const automatic = getCheckAnswerDistributionWidth('automatic')
const unanswered = getCheckAnswerDistributionWidth('unanswered')
const manual = getCheckAnswerDistributionWidth('manual')
const answered = computed(
  () =>
    `${(report.value?.checksAnswersDistribution['automatic'] || 0) + (report.value?.checksAnswersDistribution['manual'] || 0)}%`,
)

const showBlock = (width: string) => width !== '0%'

const statusPill = computed(() =>
  getVuetifyRunPillFromOverallResult(report.value?.overallRunResult),
)
</script>

<style lang="scss" scoped>
@use '../../styles/tokens.scss' as Tokens;
@use '../../styles/mixins/flex.scss' as Flex;

:global(body) {
  position: relative;
  background-color: rgb(var(--v-theme-background)) !important;
}

@page {
  margin-top: 0.15in;
  margin-bottom: 0in;
}

/* Left page margin */
@page :left {
  margin-left: 0in;
  margin-right: 0in;
}

/* Right page margin */
@page :right {
  margin-left: 0in;
  margin-right: 0in;
}

main {
  padding: Tokens.$space-section;
  width: 100%;

  @media print {

    :deep(.approval) {
      page-break-inside: avoid;
    }

    :deep(.thread) {
      page-break-inside: avoid;
    }

    :deep(.report-views h5) {
      page-break-inside: avoid;
    }

    :deep(.report-check-finding) {
      page-break-inside: avoid;
    }

    :deep(.sub-navi-item-layout) {
      page-break-inside: avoid;
    }
  }
}

.report-meta {
  width: 100%;

  .meta {
    @include Flex.flexbox($align: start);
    column-gap: Tokens.$space-section;

    article {
      flex: 1;

      @media print {
        min-width: auto;
      }
    }

    @media screen and (max-width: $bp-max-768) {
      display: grid;
      grid-template-columns: 1fr;
      row-gap: Tokens.$space-section;
    }
  }
}

section {
  margin-bottom: Tokens.$space-section;

  .report-section-heading {
    margin-top: 0;
    margin-bottom: 24px;
  }
}

.overall-status {
  @include Flex.flexbox;
  column-gap: 12px;

  h5 {
    font-size: 14px;
  }
}

.report-status {
  .results-answered {
    @include Flex.flexbox($direction: column, $align: start);
    row-gap: Tokens.$space-section;

    p.row {
      margin: 0;
    }

    .row.blocks {
      @include Flex.flexbox;
      width: 100%;
      column-gap: 2px;
    }

    .row.row-answered {
      width: v-bind(answered);
    }
  }
}

.status-bg-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.status-bg-block {
  height: 24px;
  width: var(--block-width);

  &.status-bg--green {
    --block-width: v-bind(green);
  }

  &.status-bg--red {
    --block-width: v-bind(red);
  }

  &.status-bg--yellow {
    --block-width: v-bind(yellow);
  }

  &.status-bg--na {
    --block-width: v-bind(na);
  }

  &.status-bg--unanswered {
    --block-width: v-bind(unanswered);
  }

  &.status-bg--automatic {
    --block-width: v-bind(automatic);
  }

  &.status-bg--manual {
    --block-width: v-bind(manual);
  }
}

.status-bg--green {
  background-color: #4CAF50; // rgb(var(--v-theme-green-status)) // green
}

.status-bg--yellow {
  background-color: #FBC02D; // rgb(var(--v-theme-yellow-status)) // yellow
}

.status-bg--red {
  background-color: #F44336; // rgb(var(--v-theme-red-status)) // red
}

.status-bg--na {
  background-color: #1565C0; // rgb(var(--v-theme-na-status)) // blue-darken-3
}

.status-bg--unanswered {
  background-color: #80CBC4; // rgb(var(--v-theme-unanswered-status)) // teal-lighten-3
}

.status-bg--manual {
  background-color: #00897B; // rgb(var(--v-theme-manual-status)) // teal-darken-1
}

.status-bg--automatic {
  background-color: #004D40; // rgb(var(--v-theme-automatic-status)) // teal-darken-4
}

.report-approver-comment {
  border-top: 1px solid rgb(var(--v-theme-background));
  padding: Tokens.$spacing-8 Tokens.$spacing-8 Tokens.$spacing-8 Tokens.$spacing-16;

  :deep(p) {
    font-size: rem(14px);
    margin: 0;
  }
}

.report-approval {

  .approval:not(:last-child) {
    margin-bottom: Tokens.$space-component-m;
  }

  .m-approver-item {
    margin-bottom: 0;
    border-bottom: 1px solid rgb(var(--v-theme-background));
  }

  .m-approver-status {
    margin-bottom: 0;
    border-bottom: 1px solid rgb(var(--v-theme-background));
  }
}

.-no-extra-margin {
  margin: 0;
}
</style>
