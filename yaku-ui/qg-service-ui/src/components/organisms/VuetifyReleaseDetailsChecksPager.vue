<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div class="bg-grey-lighten-2 pa-4">
    <div class="check-accordion check-title">
      <div class="title-and-status">
        <VuetifyStatusPill v-if="checkStatus" rounded v-bind="getResultPillFromStatus(checkStatus, !!currentReleaseOverride)
          ">
          <template #icon>
            <FrogIcon v-if="
              getResultPillFromStatus(checkStatus, !!currentReleaseOverride)
                .icon
            " :icon="getResultPillFromStatus(checkStatus, !!currentReleaseOverride)
                  .icon ?? ''
                " />
            <component :is="getResultPillFromStatus(checkStatus, !!currentReleaseOverride)
                .iconComponent
              " v-else />
          </template>
        </VuetifyStatusPill>
        <FrogPopover class="check-heading" :label="check.title" attached triggerOnHover tooltipAlike
          arrowPlacementClass="-without-arrow-top" pophoverClass="heading-title-popover">
          <VuetifyMarkdown tag="h5" class="" :source="`${check.id}. ${check.title} ${formatCheckBadge(
            getCheckBadge(check)
          )}`" />
        </FrogPopover>
      </div>
      <div v-if="currentReleaseOverride && overrideComment" class="override-comment bg-white px-2">
        <div class="override-comment__heading">
          <div class="">
            <p class="font-weight-bold">
              Manual Status Change:
              {{
                textMap.get(currentReleaseOverride.manualColor as CheckColor)
              }}
            </p>
            <span class="">{{
              useRecentDateFormat(currentReleaseOverride.lastModificationTime)
              }}</span>
          </div>
          <div class="right">
            <FrogPopover v-if="!closed" label="Edit check status" attached triggerOnHover tooltipAlike
              arrowPlacementClass="-without-arrow-top">
              <FrogButton integrated @click="showDialogOverrideResultStatus = true">
                <FrogIcon icon="mdi-pencil-outline" />
              </FrogButton>
            </FrogPopover>
          </div>
        </div>
        <div class="override-comment__comment bg-background">
          <VuetifyShowMore>
            <template #default>
              <VuetifyMarkdown tag="p" :source="overrideComment" />
            </template>
          </VuetifyShowMore>
        </div>
      </div>
    </div>
    <div class="check-title-actions">
      <div class="a-page-indicator" :data-start-index="1" :data-max-length="pagesCount" role="navigation" aria-label="Checks navigator">
        <FrogButton integrated icon="mdi-chevron-left" aria-label="go to previous page" :disabled="currentPage === 1"
          @click.prevent="emit('previous')" />
        <div>
          <p>{{ currentPage }} of {{ pagesCount }}</p>
        </div>
        <FrogButton integrated icon="mdi-chevron-right" aria-label="go to next page"
          :disabled="currentPage === pagesCount" @click.prevent="emit('next')" />
      </div>
      <div class="a-page-indicator">
        <FrogPopover v-if="!overrideComment && !closed" label="Change to manual check status" attached triggerOnHover
          tooltipAlike arrowPlacementClass="-without-arrow-top">
          <FrogButton integrated @click="showDialogOverrideResultStatus = true">
            <FrogIcon icon="mdi-pencil-outline" />
          </FrogButton>
        </FrogPopover>
        <FrogPopover label="Jump to definition" attached triggerOnHover tooltipAlike
          arrowPlacementClass="-without-arrow-top">
          <RouterLink class="transparent-link check-code-jump" :to="{
            name: ROUTE_NAMES.CONFIG_EDIT,
            params: { ...urlContext, id: `${configId}` },
            query: {
              content: `chapter${DOUBLE_HYPHEN}${check.chapterId}${DOUBLE_HYPHEN}requirement${DOUBLE_HYPHEN}${check.requirementId}${DOUBLE_HYPHEN}check${DOUBLE_HYPHEN}${check.id}`,
              editor: preferredEditor,
              ...route.query,
            },
          }">
            <FrogIcon icon="mdi-open-in-new" />
          </RouterLink>
        </FrogPopover>
        <FrogPopover :label="showFindings ? 'Close findings' : 'Open findings'" attached triggerOnHover tooltipAlike
          arrowPlacementClass="-without-arrow-top">
          <FrogButton integrated :icon="showFindings ? 'mdi-chevron-up' : 'mdi-chevron-down'"
            :disabled="!check?.evaluation?.results?.length" @click="showFindings = !showFindings" />
        </FrogPopover>
      </div>
    </div>
    <div v-if="check?.evaluation?.reason" class="check-reason-wrapper mb-6">
      <hr>
      <div class="check-reason">
        <p class="font-weight-bold">
          Reason
        </p>
        <VuetifyShowMore :key="currentPage">
          <template #default>
            <VuetifyMarkdown tag="div" :source="check.evaluation.reason" />
          </template>
        </VuetifyShowMore>
      </div>
    </div>
    <ul v-if="showFindings" class="semantic-list">
          <li v-for="result in check?.evaluation?.results" :key="result.criterion" class="result-item">
            <VuetifyResultItem status="finding" :result="result" resolve-finding="dialog" :finding="getFindingFromRunResult(
              check.chapterId,
              check.requirementId,
              check.id,
              result.criterion,
              result.justification
            )
              " @resolve-finding="openFindingDetailsDialog" />
          </li>
        </ul>
  </div>

  <Teleport to="#app">
    <VuetifyBlurBackground v-if="showFindingDetailsDialog && findingBeingResolved">
      <FrogDialog v-bind="$attrs" id="findingDetailsDialog" title="Finding details" open
        @close="closeFindingDetailsDialog">
        <template #body>
          <VuetifyFindingDetail :finding="findingBeingResolved" dialog @resolve="handleResolve"
            @unresolve="handleUnresolve" @close-dialog="closeFindingDetailsDialog" />
        </template>
      </FrogDialog>
    </VuetifyBlurBackground>
  </Teleport>

  <Teleport to="#app">
    <VuetifyDialogOverrideResultStatus v-if="showDialogOverrideResultStatus" :check="currentCheck"
      :message="overrideComment" :releaseId="Number(releaseId)" :releaseOverride="currentReleaseOverride"
      @update="updateReleaseOverrides($event)" @reset="onRevertState" @close="showDialogOverrideResultStatus = false" />
  </Teleport>
</template>
<script setup lang="ts">
import {
  ChapterReport,
  CheckReport,
  getCheckBadge,
  RequirementReport,
  ResultReport,
} from '~helpers'
import { getResultPillFromStatus } from '~/helpers/getPillInfo'
import { DOUBLE_HYPHEN } from '~/config/app'
import { ROUTE_NAMES } from '~/router'
import { useUrlContext } from '~/composables'
import { useRoute } from 'vue-router'
import { Check, CheckColor } from '~/types/Release'
import { computed, onMounted, ref, watch } from 'vue'
import useConfigFindings from '~/composables/useConfigFindings'
import { Finding } from '~/types'
import useResolveFinding from '~/composables/useResolveFinding'
import { ReleaseOverrideReference } from '~/api'
import useUserProfileStore from '~/store/useUserProfileStore'
import { storeToRefs } from 'pinia'
import { useRecentDateFormat } from '~/composables'
import { textMap } from '~/helpers/getPillInfo'
import useReleaseOverridesStore from '~/store/useReleaseOverridesStore'

const props = defineProps<{
  configId: number | string | undefined
  check: Check
  currentPage?: number
  pagesCount: number
  closed?: boolean
}>()

const emit = defineEmits<{
  (e: 'next'): void
  (e: 'previous'): void
}>()

const checkStatus = ref<string>()

const route = useRoute()
const { urlContext } = useUrlContext()
const formatCheckBadge = (badge: { label: string } | undefined) =>
  badge ? `(${badge.label})` : ''
const getFindingFromRunResult = (
  chapter: ChapterReport['id'],
  requirement: RequirementReport['id'],
  check: CheckReport['id'],
  criterion: ResultReport['criterion'],
  justification: ResultReport['justification'],
) => {
  if (findings.value)
    return findings.value.find(
      (f) =>
        f.chapter === chapter &&
        f.requirement == requirement &&
        f.check === check &&
        f.criterion === criterion &&
        f.justification === justification,
    )
}
const { findings, fetchAllFindings, updateFinding } = useConfigFindings()
const showFindings = ref<boolean>(false)

onMounted(async () => {
  await updateReleaseOverrides()
  checkStatus.value =
    currentReleaseOverride.value?.manualColor ?? props.check.status
  await fetchAllFindings(props.configId as string)
})

const showFindingDetailsDialog = ref<boolean>(false)
const findingBeingResolved = ref<Finding>()
const { onResolve, onUnresolve } = useResolveFinding(findingBeingResolved)
const handleResolve = async (comment: string) => {
  await onResolve(comment)
  if (findingBeingResolved.value) updateFinding(findingBeingResolved.value)
}
const handleUnresolve = async () => {
  await onUnresolve()
  if (findingBeingResolved.value) updateFinding(findingBeingResolved.value)
}
const openFindingDetailsDialog = async (finding: Finding) => {
  showFindingDetailsDialog.value = true
  findingBeingResolved.value = finding
}

const closeFindingDetailsDialog = () => {
  showFindingDetailsDialog.value = false
  findingBeingResolved.value = undefined
}

const releaseId = ref(route.params.id as unknown as number)
const releaseOverrideStore = useReleaseOverridesStore()
const releaseOverrides = storeToRefs(releaseOverrideStore)

const updateReleaseOverrides = async (newStatus?: string) => {
  await releaseOverrideStore.getReleaseOverrides(releaseId.value)
  if (newStatus) {
    checkStatus.value = newStatus ?? props.check.status
  }
}

const onRevertState = async () => {
  await releaseOverrideStore.getReleaseOverrides(releaseId.value)
  checkStatus.value = props.check.originalStatus
}

const currentReleaseOverride = computed(() =>
  releaseOverrides.overrides.value?.find((override) =>
    findReference(props.check, override.reference),
  ),
)
const overrideComment = computed(() => currentReleaseOverride.value?.comment)
const checkHasResults = computed(
  () => props.check && props.check?.evaluation?.results?.length,
)

const findReference = (newCheck: Check, override: ReleaseOverrideReference) => {
  return (
    newCheck.chapterId === override.chapter &&
    newCheck.requirementId === override.requirement &&
    newCheck.id === override.check
  )
}

const currentCheck = ref(props.check)

watch(
  () => props.check,
  (newCheck) => {
    if (releaseOverrides.overrides.value) {
      checkStatus.value =
        currentReleaseOverride.value?.manualColor ?? props.check.status
      currentCheck.value = newCheck
    }
    showFindings.value = !!checkHasResults.value
  },
)

const showDialogOverrideResultStatus = ref(false)

const userProfileStore = useUserProfileStore()
const { editor: preferredEditor } =
  storeToRefs(userProfileStore).userProfile.value
</script>
<style scoped lang="scss">
@use "../../styles/abstract" as *;
@use "../../styles/tokens.scss" as *;
@use "../../styles/mixins/flex.scss" as Flex;

.check-title {
  grid-row: 1/2;
  grid-column: 1/2;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-direction: column;
  gap: $space-component-xs;

  .title-and-status {
    display: grid;
    grid-template-columns: auto auto;
    align-items: center;
    justify-content: flex-start;
  }


}

.check-title-actions {
  display: flex;
  gap: $space-component-xs;
  flex-shrink: 0;
  justify-content: space-between;
  width: 100%;
}

.check-title-actions-popover {
  display: flex;
}

.override-comment {
  width: 100%;
  margin-top: 12px;

  &__heading {
    @include Flex.flexbox($justify: space-between);

    h3 {
      font-size: 14px !important;
    }

    span {
      font-size: 12px !important;
    }
  }

  &__comment {
    padding: 8px;
  }

  h3,
  p {
    font-size: unset;
    margin: 0;
    padding: 0;
  }
}

.check-accordion {
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: $spacing-24;

  :deep(.a-accordion__headline:hover) {
    color: currentColor;
  }

  :deep(h5),
  :deep(p),
  :deep(span) {
    line-height: 1.285;
  }

  h3 {
    padding: $padding-component-s 0;
  }
  :deep(.v-expansion-panel-title) {
    padding: $space-component-m;
    display: grid;
    grid-template-columns: 1fr auto;
    row-gap: $space-component-m;
    column-gap: $space-component-xs;


    .a-accordion__headline-button {
      display: none;
    }



  }

  ~.check-accordion {
    margin-top: $space-component-s;
  }

  :deep(*) {
    font-size: 0.875rem;
  }
}

.check-heading {
  word-break: break-all;

  h5 {
    margin: 0 $space-component-m;
  }
}

hr {
  margin: 0;
  background-color: black;
  border: 0;
  height: 1px;
  width: 100%;
}

.check-reason-wrapper {
      grid-row: 2/3;
      grid-column: 1/3;
      display: flex;
      flex-direction: column;
      row-gap: $space-component-m;
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
    border-top: 1px solid #E0E0E0; // grey-lighten-2
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

.check-reason>h4 {
  margin: 0;
}

.requirement-heading {
  margin: 0;
}

.requirement-text {
  margin: 0 0 $space-component-l 0;

  :deep(*) {
    font-size: 0.875rem;
  }

  :deep(p:first-child) {
    margin-top: 0;
  }

  :deep(*:last-child) {
    margin-bottom: 0;
  }
}

.a-page-indicator {
  display: flex;
  align-items: center;
}



:global(.heading-title-popover .m-popover__paragraph) {
  // display: none;
  word-break: all;
  width: 100%;
  max-width: 100%;
  word-break: break-word;
}

#findingDetailsDialog {
  --max-dialog-width: 1152px;
  margin-top: 48px; // never overflow the app header
  max-height: $dialogMaxHeight;
  overflow-y: auto;

  :deep(.finding-detail) {
    //background-color: rgb(var(--v-theme-background));
  }

  :deep(.m-dialog__headline) {
    display: none;
  }

  :deep(.m-dialog__content) {
    padding: 0 $spacing-32 $spacing-32 $spacing-32;
  }

  :deep(.m-dialog__actions) {
    display: none;
  }
}
</style>
