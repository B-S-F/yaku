<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <section ref="summaryOfCheck" class="result-report">
    <section v-for="chapter in chapters" :key="chapter.id" v-bind="$attrs">
      <VuetifyMarkdown :id="`chapter--${chapter.id}`" class="font-weight-bold chapter-heading text-h6" tag="h3"
        :source="`${chapter.id} ${chapter.title}`" />
      <!-- maybe render the chapter description (text) here? -->
      <ol class="semantic-list requirements">
        <li v-for="requirement in chapter?.requirements" :key="requirement.id" class="requirement"
          data-cy="requirement">
          <div class="requirement-details">
            <VuetifyMarkdown
              :id="`chapter${DOUBLE_HYPHEN}${chapter.id}${DOUBLE_HYPHEN}requirement${DOUBLE_HYPHEN}${requirement.id}`"
              class="font-weight-bold requirement-heading text-body-1" tag="h4"
              :source="`${requirement.id} ${requirement.title}`" />
            <VuetifyShowMore v-if="requirement.text">
              <template #default>
                <VuetifyMarkdown v-if="requirement.text" tag="div" class="md-comment" :source="requirement.text" />
              </template>
            </VuetifyShowMore>
          </div>
          <ul class="semantic-list">
            <FrogAccordion v-for="check in requirement?.checks" :key="check.id" class="check-accordion"
              :openable="(check?.evaluation?.results?.length ?? 0) > 0" :clickable="true" tag="li"
              headlineClass="no-padding" small arrowUpTooltip="Close findings" arrowDownTooltip="Open findings">
              <template #headline>
                <div class="check-title">
                  <VuetifyStatusPill rounded v-bind="getResultPillFromStatus(check.status)">
                    <template #icon>
                      <FrogIcon :icon="getResultPillFromStatus(check.status).icon ?? ''" />
                    </template>
                  </VuetifyStatusPill>
                  <VuetifyMarkdown
                    :id="`chapter${DOUBLE_HYPHEN}${chapter.id}${DOUBLE_HYPHEN}requirement${DOUBLE_HYPHEN}${requirement.id}${DOUBLE_HYPHEN}check${DOUBLE_HYPHEN}${check.id}`"
                    tag="h5" class="font-weight-bold md-comment check-heading"
                    :source="`${check.id}. ${check.title} ${formatCheckBadge(getCheckBadge(check))}`" />
                  <div class="check-title-actions">
                    <FrogPopover label="Show Explanation" attached triggerOnHover tooltipAlike
                      arrowPlacementClass="-without-arrow-top">
                      <FrogButton class="show-explanation" integrated
                        :disabled="!check.evaluation.reason && !check.evaluation.execution"
                        @click.stop="emit('explain-autopilot', { chapter: chapter.id, requirement: requirement.id, check: check.id })">
                        <VuetifyRobotBodyFilled />
                      </FrogButton>
                    </FrogPopover>
                    <FrogPopover :label="check.evaluation.reason || check.evaluation.execution ? 'Show logs' : ''"
                      attached triggerOnHover tooltipAlike arrowPlacementClass="-without-arrow-top">
                      <FrogButton class="show-autopilot" integrated
                        :disabled="!check.evaluation.reason && !check.evaluation.execution"
                        @click.stop="emit('show-autopilot', check.evaluation)">
                        <FrogIcon icon="mdi-file-code-outline" />
                      </FrogButton>
                    </FrogPopover>
                    <!-- TODO: add replay check action -->
                    <FrogPopover label="Jump to definition" attached triggerOnHover tooltipAlike
                      arrowPlacementClass="-without-arrow-top">
                      <RouterLink class="transparent-link check-code-jump"
                        :to="{ name: ROUTE_NAMES.CONFIG_EDIT, params: { ...urlContext, id: `${configId}` }, query: { content: `chapter${DOUBLE_HYPHEN}${chapter.id}${DOUBLE_HYPHEN}requirement${DOUBLE_HYPHEN}${requirement.id}${DOUBLE_HYPHEN}check${DOUBLE_HYPHEN}${check.id}`, editor: preferredEditor, ...route.query } }">
                        <FrogIcon icon="mdi-open-in-new" />
                      </RouterLink>
                    </FrogPopover>
                  </div>
                </div>
                <div v-if="check?.evaluation?.reason" class="check-reason-wrapper">
                  <hr>
                  <div class="check-reason">
                    <h4>Reason</h4>
                    <VuetifyShowMore>
                      <template #default>
                        <VuetifyMarkdown tag="div" class="md-comment" :source="check.evaluation.reason" />
                      </template>
                    </VuetifyShowMore>
                  </div>
                </div>
              </template>
              <template #content>
                <ul class="semantic-list">
                  <li v-for="result in check?.evaluation?.results" :key="result.criterion" class="result-item">
                    <VuetifyResultItem status="check" :result="result"
                      :finding="getFindingFromRunResult(chapter.id, requirement.id, check.id, result.criterion, result.justification)" />
                  </li>
                </ul>
              </template>
            </FrogAccordion>
          </ul>
        </li>
      </ol>
    </section>
    <Teleport v-if="scrollYPos > 0" to="#run-result-content">
      <FrogPopover class="to-top" label="Back to top" attached triggerOnHover tooltipAlike
        arrowPlacementClass="-without-arrow-top">
        <FrogButton secondary icon="mdi-up" data-cy="back-to-top" @click="scrollToTop" />
      </FrogPopover>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { useScroll } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { DOUBLE_HYPHEN } from '~/config/app'
import type {
  ChapterReport,
  CheckReport,
  EvaluationReport,
  RequirementReport,
  ResultReport,
  RunReportV1,
} from '~/helpers'
import { ROUTE_NAMES } from '~/router'
import useUserProfileStore from '~/store/useUserProfileStore'
import type { Finding } from '~/types'
import { useScrollHighlight, useUrlContext } from '~composables'
import { getCheckBadge, getResultPillFromStatus } from '~helpers'

const props = defineProps<{
  chapters: RunReportV1['chapters']
  configId: number
  findings: Finding[]
  target?: string
}>()

const emit = defineEmits<{
  (e: 'show-autopilot', payload: EvaluationReport): void
  (
    e: 'explain-autopilot',
    payload: { check: string; chapter: string; requirement: string },
  ): void
}>()

const route = useRoute()
const { urlContext } = useUrlContext()

useScrollHighlight({ targetId: computed(() => props.target) })

const getFindingFromRunResult = (
  chapter: ChapterReport['id'],
  requirement: RequirementReport['id'],
  check: CheckReport['id'],
  criterion: ResultReport['criterion'],
  justification: ResultReport['justification'],
) => {
  return props.findings.find(
    (f) =>
      f.chapter === chapter &&
      f.requirement == requirement &&
      f.check === check &&
      f.criterion === criterion &&
      f.justification === justification,
  )
}

const summaryOfCheck = ref<HTMLElement>()
const { y: scrollYPos } = useScroll(summaryOfCheck)
const scrollToTop = () => {
  summaryOfCheck.value?.scroll({ top: 0 })
}

const formatCheckBadge = (badge: { label: string } | undefined) =>
  badge ? `(${badge.label})` : ''

const userProfileStore = useUserProfileStore()
const { editor: preferredEditor } =
  storeToRefs(userProfileStore).userProfile.value
</script>

<style scoped lang="scss">
@use '../../styles/components/summary-of-checks' as *;

.result-report {
  display: flex; // align the success illustration vertically
  row-gap: $space-elements;
  flex-flow: column nowrap;

  >header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    h2 {
      margin: 0;
    }
  }
}

.chapter-heading {
  margin: $space-component-s 0;
}

.requirements {
  display: flex;
  flex-direction: column;
  gap: $spacing-24;
}

.requirement {
  display: flex;
  flex-direction: column;
  gap: $spacing-24;

  :deep(*) {
    font-size: 0.875rem;
  }

  :deep(.v-icon) {
    font-size: $size-icon-m;
  }
}

.requirement-details {
  padding: $padding-component-xxs 0;
  display: flex;
  flex-direction: column;
  gap: $space-component-xs;
  line-height: 1.285;
}

h4.requirement-heading {
  font-size: 1rem;
  line-height: 1.5;
}

.requirement-heading,
.check-reason>h4 {
  margin: 0;
}

:deep(.v-expansion-panel .v-expansion-panel-title:hover) {
  color: currentColor;
}

.check-accordion {
  margin: 0;
  padding: 0;

  :deep(h5),
  :deep(p),
  :deep(span) {
    line-height: 1.285;
  }

  h3 {
    padding: $padding-component-s 0;
  }

  ~.check-accordion {
    margin-top: $space-component-s;
  }

  & :deep(.v-expansion-panel-text) {
    padding: 0 $padding-component-s $padding-component-s;
    display: flex;
    flex-direction: column;
    gap: $space-component-m;
  }

  &:deep(.v-expansion-panel) {
    padding-left: 0px;
  }

  & :deep(.v-expansion-panel-title) {
    padding: $space-component-m;
    display: grid;
    grid-template-columns: 1fr auto;
    row-gap: $space-component-m;
    column-gap: $space-component-xs;

    .check-title {
      grid-row: 1/2;
      grid-column: 1/2;
      display: flex;
      align-items: center;

      .check-title-actions {
        display: flex;
        gap: $space-component-xs;
      }
    }

    .v-expansion-panel-title__icon {
      grid-row: 1/2;
      grid-column: 2/3;
    }

    .check-reason-wrapper {
      grid-row: 2/3;
      grid-column: 1/3;
      display: flex;
      flex-direction: column;
      row-gap: $space-component-m;
    }
  }

  & :deep([data-tooltip]:hover:before) {
    left: -5rem;
  }
}

.requirement .finding-count-pill {
  white-space: nowrap;
  padding: 0 $padding-component-s;
  border-radius: 16px;
  font-size: 0.75rem;
  margin-right: $space-component-s;
}

.check-heading {
  margin: 0 $space-component-m;
  flex-grow: 1;
  // allow check heading to break words for long links in some cases
  word-break: break-all;
}

hr {
  margin: 0;
  background-color: #7d8389;

  border: 0;
  height: 1px;
  width: 100%;
}

.check-reason {
  display: flex;
  flex-direction: column;
  gap: $space-component-xs;
}

li.result-item {
  display: flex;
  padding: $padding-component-s;

  &+.result-item {
    border-top: 1px solid #7d8389;
  }

  :deep(.result-actions) {
    align-self: center;
    visibility: hidden;
  }

  &:hover {
    :deep(.result-actions) {
      visibility: visible;
    }
  }

  :deep(.popover-open) {
    visibility: visible;
  }
}

.check-code-jump {
  display: flex;
  align-items: center;
  padding: $space-component-m;
  height: 100%;
}

.show-autopilot[disabled]::before {
  display: none;
}

.show-explanation[disabled]::before {
  display: none;
}

.show-explanation {
  :deep(.v-btn__content svg) {
    color: #18837e;
    ;
  }
}

.show-explanation:hover {
  :deep(.v-btn__content svg) {
    color: #116864;
  }
}

.show-explanation:focus,
.show-explanation:focus-within {
  :deep(.v-btn__content svg) {
    color: #0a4f4b;
  }
}

.show-explanation:disabled {
  :deep(.v-btn__content svg) {
    color: #0e5b57;
  }
}

/** attached to the parent in RunResults.vue */
.to-top {
  display: block;
  position: absolute;
  bottom: 0;
  right: -$space-component-l;
  transform: translateX(100%);
}
</style>
