<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <article class="config-view">
    <section v-for="chapter in chapters" :key="chapter.id" class="chapter-list">
      <h3 :id="`chapter${DOUBLE_HYPHEN}${chapter.id}`" class="chapter-heading text-subtitle-1 font-weight-bold">
        {{ chapter.id }} {{ chapter.title }}
      </h3>
      <!-- maybe render the chapter description (text) here? -->
      <!-- <hr> -->
      <ol class="semantic-list requirement-list">
        <li v-for="requirement in chapter.requirements" :key="requirement.id" class="requirement">
          <div class="requirement-header">
            <h4 :id="`chapter${DOUBLE_HYPHEN}${chapter.id}${DOUBLE_HYPHEN}requirement${DOUBLE_HYPHEN}${requirement.id}`"
              class="requirement-heading text-subtitle-1 font-weight-bold">
              <VuetifyMarkdown tag="span" :source="`${requirement.id} ${requirement.name}`" />
            </h4>
          </div>
          <VuetifyMarkdown v-if="requirement.text" tag="div" class="requirement-text" :source="requirement.text" />
          <ul class="check-list semantic-list">
            <li v-for="check in requirement.checks" :key="check.id" class="check ">
              <div class="check-header">
                <VuetifyMarkdown tag="h5" class="check-heading md-comment text-body-1" :source="check.name" />
                <FrogButton v-if="check.autopilot" v-tooltip="{ label: 'Run check' }" integrated icon="mdi-play-outline"
                  data-cy="start-test-run" :disabled="hasRunningTest"
                  @click="emit('start-test-run', { chapter: chapter.id, requirement: requirement.id, check: check.id })" />
                <RouterLink v-tooltip="{ label: 'Jump to code' }"
                  :to="{ query: { content: serializeAutopilotJump({ chapterId: chapter.id, requirementId: requirement.id, checkId: check.id }), editor: 'code' } }">
                  <FrogButton integrated icon="mdi-application-brackets-outline" tabindex="-1" />
                </RouterLink>
              </div>

              <template v-if="check.autopilot">
                <div class="autopilot">
                  <VuetifyAppIcon :name="check.autopilot.name" />
                  <span class="highlighted autopilot-name">{{ check.autopilot.name }}</span>
                  <FrogButton v-tooltip="{ label: 'Edit variables' }" integrated icon="mdi-pencil-outline"
                    @click="emit('edit-automation', { chapterId: chapter.id, requirementId: requirement.id, checkId: check.id })" />
                  <!-- Jump to the autopilot definition -->
                  <!-- <RouterLink class="transparent-link finding-link"
                    :to="{ query: { editor: 'visual', content: `autopilots-${check.autopilot.name}` } }">
                    <FrogIcon icon="arrow-right-up" />
                  </RouterLink> -->
                  <FrogButton v-tooltip="{ label: 'Change to manual check' }" class="remove-automation" icon=""
                    integrated @click="emit('delete-automation', {
                      chapterId: chapter.id, requirementId: requirement.id, checkId:
                        check.id
                    })">
                    <VuetifyManualMode style="width: 1em;" />
                  </FrogButton>
                </div>
              </template>

              <div v-else-if="check.manual" class="manual">
                <VuetifyStatusPill class="" rounded v-bind="getResultPillFromStatus(check.manual.status)">
                  <template #icon>
                    <FrogIcon :icon="getResultPillFromStatus(check.manual.status).icon ?? ''" />
                  </template>
                </VuetifyStatusPill>
                <div class="manual-information">
                  <span>Manual Status</span>
                  <span class="manual-status">
                    {{ check.manual.status.toLocaleLowerCase() }}
                  </span>
                </div>
                <div class="manual-information">
                  <span>Reason</span>
                  <VuetifyMarkdown style="margin: 0;" tag="div" :source="check.manual.reason" />
                </div>
                <FrogButton v-tooltip="{ label: 'Edit check state' }" class="first-action" integrated
                  icon="mdi-pencil-outline"
                  @click="onManualCheckEdit(chapter.id, requirement.id, check.id, check.manual, check.name)" />
                <FrogButton v-tooltip="{ label: 'Change to automated state' }" class="automate-trigger" integrated
                  icon="mdi-refresh-auto" @click="showAutomateMenu(chapter.id, requirement.id, check.id)" />
                <dialog :id="getAutomateMenuId(chapter.id, requirement.id, check.id)"
                  v-on-click-outside="closeAutomateMenu" class="automate-menu dialog-reset">
                  <div class="arrow-container">
                    <div class="arrow-top" />
                  </div>
                  <VuetifyYakuSelectOption v-if="automateMenuOf" :options="automationOptions"
                    @select="onAutomationSelection($event, automateMenuOf.path)" />
                </dialog>
              </div>
            </li>
          </ul>
        </li>
      </ol>
    </section>
  </article>
</template>

<script setup lang="ts">
import { vOnClickOutside } from '@vueuse/components'
import { useEventListener } from '@vueuse/core'
import { computed, ref } from 'vue'
import type { SingleCheck } from '~/api'
import { DOUBLE_HYPHEN } from '~/config/app'
import type { App } from '~/types/AppCatalog'
import type { AutopilotPath, CheckPath, CodeJump } from '~/types/Editor'
import type { Manual, OnyxConfiguration } from '~/types/OnyxConfiguration'
import { serializeAutopilotJump, useScrollHighlight } from '~composables'
import {
  ReplaceableVars,
  getResultPillFromStatus,
  parseAppExecutableFromAutopilotRun,
  replaceAllVariables,
} from '~helpers'

const props = defineProps<{
  configuration: OnyxConfiguration
  apps: App[]
  varsToReplace: ReplaceableVars
  hasRunningTest?: boolean
  target?: {
    chapter?: string
    requirement?: string
  }
}>()

const emit = defineEmits<{
  (e: 'create-autopilot', payload: { path: CheckPath }): void
  (e: 'use-autopilot', payload: { path: CheckPath; autopilotId: string }): void
  (e: 'delete-automation', autopilotPath: AutopilotPath): void
  (e: 'edit-automation', autopilotPath: AutopilotPath): void
  (
    e: 'edit-manual',
    payload: { manual: Manual; path: CheckPath; checkTitle: string },
  ): void
  (e: 'jump', jump: CodeJump): void
  (e: 'start-test-run', payload: SingleCheck): void
}>()

/**
 * Create a custom data structure that push apps in the autopilot property of a check.
 * It should provide an easy access to data in the view.
 */
const chapters = computed(() =>
  Object.entries(props.configuration.chapters).map(([id, chapter]) => ({
    id,
    title: chapter.title,
    requirements: Object.entries(chapter.requirements).map(
      ([requirementId, requirement]) => ({
        id: requirementId,
        name: replaceAllVariables(requirement.title, props.varsToReplace),
        text: requirement.text
          ? replaceAllVariables(requirement.text, props.varsToReplace)
          : undefined,
        checks: Object.entries(requirement.checks).map(([checkId, check]) => ({
          id: checkId,
          name: replaceAllVariables(check.title, props.varsToReplace),
          autopilot: check.automation
            ? {
                name: check.automation.autopilot,
                config: check.automation.config,
                env: check.automation.env,
                apps: parseAppExecutableFromAutopilotRun(
                  props.configuration.autopilots[check.automation.autopilot]
                    .run,
                  props.apps,
                ),
              }
            : undefined,
          manual: check.manual
            ? {
                status: check.manual.status,
                reason: replaceAllVariables(
                  check.manual?.reason,
                  props.varsToReplace,
                ),
              }
            : undefined,
          // TODO: provide more infos as needed
        })),
      }),
    ),
  })),
)

const scrollTargetId = computed(() => {
  if (!props.target) return
  const { chapter, requirement } = props.target
  return `chapter${DOUBLE_HYPHEN}${chapter}${requirement ? `${DOUBLE_HYPHEN}requirement${DOUBLE_HYPHEN}${requirement}` : ''}`
})
useScrollHighlight({ targetId: scrollTargetId })

// const onAutopilotEdit = (chapterId: string, requirementId: string, checkId: string) => {
//   emit('edit-autopilot', { chapterId, requirementId, checkId })
// }

const onManualCheckEdit = (
  chapterId: string,
  requirementId: string,
  checkId: string,
  manual: Manual,
  checkTitle: string,
) => {
  // copy the manual property to avoid in-place modifications
  emit('edit-manual', {
    manual: { ...manual },
    path: { chapterId, requirementId, checkId },
    checkTitle,
  })
}

const CREATE_AUTOPILOT_OPTION = {
  id: '_create',
  icon: 'mdi-plus',
  label: 'Create New',
}
const automationOptions = computed(() => {
  return [
    ...Object.keys(props.configuration.autopilots).map((x) => ({
      id: x,
      label: x,
    })),
    CREATE_AUTOPILOT_OPTION,
  ]
})
const automateMenuOf = ref<{ path: CheckPath; el: HTMLDialogElement }>()
const getAutomateMenuId = (
  chapter: string,
  requirement: string,
  check: string,
) =>
  `automate-menu${DOUBLE_HYPHEN}${chapter}${DOUBLE_HYPHEN}${requirement}${DOUBLE_HYPHEN}${check}`
const showAutomateMenu = (
  chapterId: string,
  requirementId: string,
  checkId: string,
) => {
  const id = getAutomateMenuId(chapterId, requirementId, checkId)
  const dialog = document.getElementById(id) as HTMLDialogElement
  dialog.show()
  automateMenuOf.value = {
    el: dialog,
    path: { chapterId, requirementId, checkId },
  }
}
const closeAutomateMenu = () => {
  automateMenuOf.value?.el.close()
  automateMenuOf.value = undefined
}
useEventListener('keyup', (e) => {
  if (e.key === 'Escape') closeAutomateMenu()
})
const onAutomationSelection = (
  option: { id: string; icon?: string; label?: string },
  path: CheckPath,
) => {
  if (option.id === CREATE_AUTOPILOT_OPTION.id) {
    emit('create-autopilot', { path })
  } else {
    emit('use-autopilot', { path, autopilotId: option.id })
  }
  closeAutomateMenu()
}
</script>

<style scoped lang="scss">
.chapter-list {
  display: flex;
  flex-direction: column;
  margin-bottom: $space-component-xl;
}

.chapter-heading {
  margin: 0;

  // &+hr {
  //   width: 100%;
  //   background-color: var(--small__enabled__fill__default);
  // }
}

.requirement-list {
  margin-top: $space-heading;
  display: flex;
  flex-direction: column;
  row-gap: $space-component-xl;
}

.requirement {
  display: flex;
  flex-direction: column;
  row-gap: $space-component-s;
}

.requirement-header {
  display: flex;
  justify-content: space-between;
  padding-right: $space-component-m;

  .requirement-actions {
    display: flex;
    column-gap: $space-component-buttonGroup;
    height: 1.5rem; // matching the line-height
    transform: translateY(-0.75rem); // padding-top of a button

    >a {
      height: fit-content;
    }
  }
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

.check-list {
  display: flex;
  flex-direction: column;
  margin-top: $space-component-l;
  row-gap: $spacing-24;
}

li.check {
  padding: $padding-component-m;
  background-color: #E0E0E0; // grey-lighten-2

  .v-btn {
    transition: $reveal-effect;
    opacity: $reveal-start;
  }

  &:hover,
  &:focus,
  &:focus-within {
    .v-btn {
      opacity: $reveal-end;
    }
  }
}

.check-header {
  display: flex;
  align-items: center;
  column-gap: $space-component-m;
  // separator (only visual)
  border-bottom: 1px solid rgb(var(--v-border-color));

  // handle the spacing between the separator
  padding-bottom: $space-component-m;
  margin-bottom: $space-component-m;
}

.check-heading {
  margin: 0 auto 0 0;
}

:deep(.check-heading.md-comment) {
  @import '../../styles/components/run-report-md-format';
}

// autopilot and manual representation shares the same layout
.autopilot,
div.manual {
  position: relative;
  display: flex;
  align-items: center;
  column-gap: $space-component-m;
}

.autopilot {
  +.autopilot {
    margin-top: $space-component-s;
  }
}

.manual-information {
  display: flex;
  flex-direction: column;

  &.manual-information {
    // add suplementary space between manual informations
    margin-right: $space-component-m;
  }
}

.manual-status {
  text-transform: capitalize;
}

/** it is inside the relative .manual container */
.automate-menu {
  position: absolute;
  bottom: -0.5rem;
  left: 100%;
  width: fit-content;
  transform: translate(-100%, 100%);
  z-index: 2;

  &.dialog-reset {
    overflow: visible;
  }

  /** use a container to display the shadow */
  .arrow-container {
    $height: 1rem;
    $width: 1.5rem;
    top: -$height;
    width: $width;
    height: $height;
    margin: 2px;
    background-color: transparent;
    position: absolute;
    left: 100%;
    transform: translateX(calc(-95% - 1rem));
    filter: drop-shadow(0 0 .5rem var(--shadow-fill));

    >.arrow-top {
      width: $width;
      height: $height;
      background-color: #E0E0E0; // grey-lighten-2
      clip-path: polygon(50% 0, 100% 100%, 0 100%);
    }
  }
}

.first-action {
  margin-left: auto;
}

.autopilot-name {
  flex-grow: 1;
}

[data-tooltip]:hover::before {
  text-align: center;
  max-width: 6.5rem;
  left: -50%;
}

.automate-trigger,
.remove-automation {
  &[data-tooltip]:hover::before {
    width: 6.5rem;
    left: -65%;
  }
}
</style>
