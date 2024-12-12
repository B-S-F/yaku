<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <article class="finding-detail bg-background">
    <header v-if="finding">
      <h2 v-if="finding.criterion && dialog" class="text-body-1 font-weight-bold">
        {{ finding.criterion }}
      </h2>
      <span v-if="finding.runCompletionTime" class="date">{{
        useRecentDateFormat(new Date(finding.updatedAt), { forceDateString: true })
      }}</span>
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
          <h3>{{ finding.occurrenceCount > 1 ? 'Occurrences' : 'Occurrence' }}</h3>
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
          <span>{{ useRecentDateFormat(new Date(finding.resolvedDate)) ?? '-' }}</span>
        </li>
        <li v-if="finding.justification" class="item block">
          <h3>Justification</h3>
          <VuetifyDescription :description="finding.justification" />
        </li>
      </ul>
      <FrogAccordion v-if="metadata" small headline="More information" data-cy="metadata-accordion">
        <template #content>
          <ul class="semantic-list finding-metadata">
            <li v-if="metadata.pkg" class="item">
              <h3>Package</h3>
              <span>{{ metadata.pkg }}</span>
            </li>
            <li v-for="[name, description] in metadata.rawMetadata" :key="name" class="item raw">
              <h3>{{ name }}</h3>
              <VuetifyDescription :description="description" />
            </li>
            <li v-if="metadata.description" class="item block">
              <h3>Description</h3>
              <VuetifyDescription :description="metadata.description" />
            </li>
          </ul>
        </template>
      </FrogAccordion>
      <div class="actions">
        <div class="action-header">
          <h3>{{ isResolved ? 'Resolved finding' : 'Resolve finding' }}</h3>
          <FrogPopover v-if="isResolved" ref="contextMenuWrapper" attached tooltipAlike
            arrowPlacementClass="-top-center" pophoverClass="popover-content-inline" :show="showContextMenu">
            <FrogButton integrated :icon="showContextMenu ? 'mdi-close' : 'mdi-dots-horizontal'"
              @click.prevent="showContextMenu = !showContextMenu" />
            <template #content>
              <ul class="semantic-list menu">
                <v-hover>
                  <template #default="{ isHovering, props: $props }">
                    <li tabindex="0" v-bind="$props"
                      :class="{ 'cursor-not-allowed text-grey-lighten-1': !isResolved, 'bg-grey-lighten-3 cursor-pointer': isHovering }"
                      @click.prevent="onEdit" @keydown.enter.prevent="onEdit">
                      <FrogIcon icon="mdi-pencil-outline" />
                      Edit
                    </li>
                  </template>
                </v-hover>
                <li tabindex="0" class="cursor-not-allowed text-grey-lighten-1" @click.prevent="onShare"
                  @keydown.enter.prevent="onShare">
                  <FrogIcon icon="mdi-share-variant-outline" />
                  Share
                </li>
                <v-hover>
                  <template #default="{ isHovering, props: $props }">
                    <li
                      :class="{ 'cursor-not-allowed text-grey-lighten-1': !isResolved, 'bg-grey-lighten-3 cursor-pointer': isHovering }"
                      tabindex="0" v-bind="$props" @click.prevent="onDelete" @keydown.enter.prevent="onDelete">
                      <FrogIcon icon="mdi-undo" />
                      Unresolve
                    </li>
                  </template>
                </v-hover>
              </ul>
            </template>
          </FrogPopover>
        </div>
        <VuetifyMarkdown v-if="!isEditing && isResolved" tag="p" class="resolved-comment"
          :source="finding.resolvedComment" />
        <template v-else-if="isEditing || !isResolved">
          <FrogTextarea :id="`resolve-comment-${finding.id}`" v-model="manualComment" class="input" />
          <div class="action-buttons">
            <FrogButton class="submit" primary :disabled="manualComment.length === 0"
              @click="emit('resolve', manualComment)">
              {{ isResolved ? 'Update' : 'Resolve with' }} comment
            </FrogButton>
            <FrogButton v-if="dialog" secondary @click.prevent="emit('close-dialog')">
              Close
            </FrogButton>
          </div>
        </template>
        <FrogButton v-if="dialog && !isEditing && isResolved" class="-self-flex-end" secondary
          @click.prevent="emit('close-dialog')">
          Close
        </FrogButton>
      </div>
    </main>
    <Teleport to="#app">
      <VuetifyBlurBackground v-if="showDeleteDialog">
        <VuetifyDeleteFindingCommentConfirmation @confirm="emit('unresolve'); showDeleteDialog = false"
          @close="showDeleteDialog = false" />
      </VuetifyBlurBackground>
    </Teleport>
  </article>
</template>

<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import useResolveFinding from '~/composables/useResolveFinding'
import { getVuetifyFindingStatusPill } from '~/helpers'
import { isAutoResolved } from '~/helpers/checkResolversName'
import type { Finding } from '~/types'
import { useRecentDateFormat } from '~composables'

const props = defineProps<{
  finding: Finding
  configName?: string
  dialog?: boolean
}>()

const emit = defineEmits<{
  (e: 'resolve', comment: string): void
  (e: 'unresolve'): void
  (e: 'close-dialog'): void
}>()

const VuetifyDeleteFindingCommentConfirmation = defineAsyncComponent(
  () =>
    import(
      '~/components/organisms/VuetifyDeleteFindingCommentConfirmation.vue'
    ),
)

const isResolved = computed(() => props.finding.status === 'resolved')

const isEditing = ref(false)
const onEdit = () => (isEditing.value = !isEditing.value)

const { getResolversName } = useResolveFinding(ref<Finding>())

const statusPill = computed(() =>
  getVuetifyFindingStatusPill(
    props.finding.status,
    isAutoResolved(props.finding.resolver),
  ),
)
const metadata = computed(() => {
  if (Object.keys(props.finding.metadata).length === 0) return undefined
  const {
    severity,
    description,
    package: pkg,
    ...rawMetadata
  } = props.finding.metadata
  return {
    severity,
    description,
    pkg,
    rawMetadata: Object.entries(rawMetadata),
  }
})

const manualComment = ref(props.finding.resolvedComment ?? '')
// sync manualComment with the finding prop
watch(
  () => props.finding.resolvedComment,
  (newVal) => {
    manualComment.value = newVal ?? ''
    isEditing.value = false // the edit is then successful if the resolvedComment changes
  },
)

const showContextMenu = ref(false)
const contextMenuWrapper = ref<InstanceType<typeof HTMLElement>>()
onClickOutside(contextMenuWrapper, () => (showContextMenu.value = false))

// TODO: implement me
const onShare = () => {}

const showDeleteDialog = ref(false)
const onDelete = () => (showDeleteDialog.value = true)
</script>

<style scoped lang="scss">
.finding-detail {
  display: flex;
  flex-direction: column;
  row-gap: 28px;
  min-height: 0;
  padding: 16px 16px 24px 16px;
  background-color: #eff1f2;
  overflow-y: auto;
}

header {
  display: flex;
  column-gap: 20px;
  align-items: center;
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

.icon {
  width: 1.5em;
}

.item {
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

.block {
  width: 100%;
}

.actions {
  display: flex;
  flex-direction: column;
  row-gap: 8px;

  .action-buttons {
    display: flex;
    align-items: center;
    column-gap: 10px;
    justify-content: flex-end;
    margin-top: $spacing-16;
  }

  .-self-flex-end {
    align-self: flex-end;
  }
}

.action-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    font-size: 1rem;
  }
}

.resolved-comment>:deep(p) {
  margin: 0;
}

/** raw copy of the FileItem.vue context menu. TODO: make it a component */
ul.menu {
  position: relative;
  z-index: 3;

  &>li {
    display: flex;
    column-gap: 8px;
    width: 240px;
    padding: 12px;
  }
}

.finding-generic-data .pill.rounded.finding-status {
  padding-right: 16px;
}
</style>
