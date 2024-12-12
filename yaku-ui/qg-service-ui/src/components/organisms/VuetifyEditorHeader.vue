<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <VuetifyToolbar ref="toolbarRef" class="toolbar-layout" :class="`toolbar--${editorType}-editor`"
    data-onboarding="toolbar">
    <VuetifyBackLink :to="{ name: ROUTE_NAMES.CONFIGS_OVERVIEW, params: urlContext }" />
    <div class="-from-sm">
      <FrogPopover attached arrowPlacementClass="-top-left" pophoverClass="editor-header-panel" :show="showEditorPanel"
        style="--y-shift: 0.5rem">
        <FrogPopover v-bind="TOOLTIP_CONFIG">
          <template #content>
            Open {{ editorType === 'visual' ? 'chapters' : 'files' }}
          </template>
          <FrogButton secondary :icon="showEditorPanel ? 'mdi-close' : 'mdi-file-document-outline'"
            @click="showEditorPanel = !showEditorPanel" />
        </FrogPopover>
        <template #content>
          <!-- for clickoutside event -->
          <div v-if="showEditorPanel" ref="editorPanelRef" class="editor-panel" :style="{
            '--editor-header-panel-width': '360px',
          }">
            <slot name="panel" />
          </div>
        </template>
      </FrogPopover>
    </div>
    <div>
      <h1 class="text-h6 font-weight-bold name" :title="config.name" :style="{ '--mw': `${toolbarWidth / 7}px` }">
        {{ config.name }}
      </h1>
      <FrogPopover attached arrowPlacementClass="-top-left" :show="showEditConfigPopover" maxWidth="32rem"
        style="--y-shift: 0.5rem">
        <FrogPopover v-bind="TOOLTIP_CONFIG">
          <template #content>
            Edit configuration
          </template>
          <FrogButton tertiary icon="mdi-pencil-outline" @click="showEditConfigPopover = true" />
        </FrogPopover>
        <template #content>
          <VuetifyEditConfigMetadata v-if="showEditConfigPopover" class="edit-config" :name="config.name"
            :description="config.description" @confirm="onEditMetadata.confirm" @close="onEditMetadata.close" />
        </template>
      </FrogPopover>
    </div>

    <div v-if="editorType === 'code' ? breakpoints.from600 : breakpoints.from640" class="toolbar-gap"
      :class="{ 'sidebar-open': isSidebarOpen }">
      <FrogPopover v-if="editorType === 'code' ? breakpoints.from600 : breakpoints.from640" v-bind="TOOLTIP_CONFIG"
        :deactivate="breakpoints.from1020">
        <template #content>
          {{ startRunLabel }}
        </template>
        <FrogButton icon="mdi-play-outline" :disabled="!!disableExecuteWithHint" data-cy="execute-button"
          @click="emit('saveExecute')">
          <span class="nowrap at-toolbar-1400">
            {{ startRunLabel }}
          </span>
        </FrogButton>
      </FrogPopover>
      <FrogPopover v-if="editorType === 'code' && breakpoints.from640" v-bind="TOOLTIP_CONFIG"
        :deactivate="breakpoints.from1440">
        <template #content>
          Create a file
        </template>
        <FrogButton secondary icon="mdi-plus" data-cy="create-file-button" @click="emit('create-file')">
          <span class="nowrap at-toolbar-1120">
            Create
          </span>
        </FrogButton>
      </FrogPopover>
      <FrogPopover v-if="editorType === 'code' && isSidebarOpen ? breakpoints.from820 : breakpoints.from710"
        v-bind="TOOLTIP_CONFIG" :deactivate="breakpoints.from1440">
        <template #content>
          Add files
        </template>
        <FrogButton secondary icon="mdi-file-plus-outline" data-cy="add-files-button" @click="fileDialog.open">
          <span class="nowrap at-toolbar-1120">
            Add
          </span>
        </FrogButton>
      </FrogPopover>
      <FrogPopover
        v-if="editorType === 'code' ? (isSidebarOpen ? breakpoints.from870 : breakpoints.from750) : breakpoints.from710"
        v-bind="TOOLTIP_CONFIG" :deactivate="breakpoints.from1440">
        <template #content>
          Save files
        </template>
        <FrogButton secondary icon="mdi-content-save-outline" data-cy="save-button" :disabled="!!disableSaveWithHint"
          @click="emit('save')">
          <span class="at-toolbar-1120">
            Save
          </span>
        </FrogButton>
      </FrogPopover>
      <FrogPopover
        v-if="editorType === 'code' ? (isSidebarOpen ? breakpoints.from960 : breakpoints.from870) : breakpoints.from830"
        v-bind="TOOLTIP_CONFIG" :deactivate="breakpoints.from1440">
        <template #content>
          Copy Config
        </template>
        <FrogButton secondary icon="mdi-file-document-multiple-outline" @click="emit('copy')">
          <span class="at-toolbar-1120">
            Copy
          </span>
        </FrogButton>
      </FrogPopover>
    </div>
    <div v-if="(isSidebarOpen ? breakpoints.from1020 : breakpoints.from940) && !hideButtons"
      :class="{ 'sidebar-open': isSidebarOpen }">
      <FrogPopover v-bind="TOOLTIP_CONFIG"
        :deactivate="editorType === 'code' ? breakpoints.from1500 : breakpoints.from1570">
        <template #content>
          Delete
        </template>
        <FrogButton tertiary icon="mdi-delete-outline" data-cy="delete-configuration--button" @click="emit('delete')">
          <span class="at-toolbar-1750">
            Delete
          </span>
        </FrogButton>
      </FrogPopover>
    </div>

    <div v-if="!hideButtons" class="context-menu-container"
      :class="[{ 'sidebar-open': isSidebarOpen, 'context-menu-code-editor': editorType === 'code' }]">
      <VuetifyInlineOrContext>
        <template #secondary-actions>
          <FrogMenuItem v-if="editorType === 'code' ? !breakpoints.from600 : !breakpoints.from640"
            :label="startRunLabel" iconName="mdi-play-outline" :isDisabled="!!disableExecuteWithHint"
            @click="emit('saveExecute')" />
          <FrogMenuItem v-if="editorType === 'code' && !breakpoints.from640" label="Create" iconName="mdi-plus"
            @click="emit('create-file')" />
          <FrogMenuItem v-if="editorType === 'code' && isSidebarOpen ? !breakpoints.from820 : !breakpoints.from710"
            label="Add" iconName="mdi-file-plus-outline" @click="fileDialog.open" />
          <FrogMenuItem
            v-if="editorType === 'code' ? (isSidebarOpen ? !breakpoints.from870 : !breakpoints.from750) : !breakpoints.from710"
            label="Save" iconName="mdi-save-outline" :isDisabled="!!disableSaveWithHint" @click="emit('save')" />
          <FrogMenuItem
            v-if="editorType === 'code' ? (isSidebarOpen ? !breakpoints.from960 : !breakpoints.from870) : !breakpoints.from830"
            label="Copy" iconName="mdi-file-document-check-outline" @click="emit('copy')" />
          <FrogMenuItem v-if="isSidebarOpen ? !breakpoints.from1020 : !breakpoints.from940" label="Delete"
            iconName="mdi-delete-outline" @click="emit('delete')" />
          <FrogMenuItem v-if="isSidebarOpen ? !breakpoints.from1125 : !breakpoints.from960"
            :label="`Switch to ${otherEditor.label} Editor`" :iconName="otherEditor.icon"
            :isDisabled="configVersion !== 'v1'" @click="switchEditor" />
        </template>
      </VuetifyInlineOrContext>
    </div>

    <div class="toolbar-gap actions"
      :class="[{ 'sidebar-open': isSidebarOpen, 'hide-editor-toggle': hideEditorToggle }]">
      <FrogPopover v-if="!hideButtons && isSidebarOpen ? breakpoints.from1125 : breakpoints.from960"
        v-bind="TOOLTIP_CONFIG" :deactivate="editorType === 'code' ? breakpoints.from1440 : breakpoints.from1500">
        <template #content>
          {{ `Switch to ${otherEditor.label} Editor` }}
        </template>
        <RouterLink class="editor-switch-link"
          :to="configVersion === 'v1' ? { query: { editor: otherEditor.value } } : ''">
          <FrogButton class="nowrap switch-editor-btn" secondary :disabled="configVersion !== 'v1'"
            :icon="otherEditor.icon" tabindex="-1">
            <span class="at-toolbar-1400">Switch to {{ otherEditor.label }} Editor</span>
          </FrogButton>
        </RouterLink>
      </FrogPopover>

      <FrogButton v-if="editorType === 'visual' && showSmallSearchInput" icon="mdi-magnify" integrated
        class="search-button" @click="expandInput" />
      <FrogTextInput v-if="editorType === 'visual' && !showSmallSearchInput" id="visual-search" ref="searchField"
        v-model="search" class="search" :class="{ 'pulse-animation': searchInputPulse }" type="search"
        placeholder="Search..." @focusout="onFocusOut" />
    </div>
  </VuetifyToolbar>
</template>

<script setup lang="ts">
import {
  MaybeElement,
  onClickOutside,
  useElementBounding,
  useFileDialog,
} from '@vueuse/core'
import {
  computed,
  defineAsyncComponent,
  nextTick,
  onUnmounted,
  Ref,
  ref,
  watch,
  watchEffect,
} from 'vue'
import type Toolbar from '~/components/molecules/Toolbar.vue'
import { useBreakpoints } from '~/composables/useBreakPoints'
import { useSidebarChecker } from '~/composables/useSidebarChecker'
import { TOOLTIP_CONFIG } from '~/helpers/getTooltipConfig'
import { ROUTE_NAMES, router } from '~/router'
import { useConfigStore } from '~/store/useConfigStore'
import type { Config, EditorType, SimpleFileItem } from '~/types'
import { storeContext, useApiCore, useApiNetworkError } from '~api'
import { useUrlContext } from '~composables'
import { provideRequestError } from '~helpers'
import { levenshtein, MAX_CONFIG_FILE_SIZE } from '~utils'

const props = defineProps<{
  config: Config & { description: string }
  configVersion: 'v0' | 'v1' | undefined
  hasChanges: boolean
  disableExecuteWithHint?: string
  editorType: EditorType | undefined
}>()

const emit = defineEmits<{
  (e: 'api-error', msg: string): void
  (e: 'update:config', config: Config & { description: string }): void
  (e: 'create-file'): void
  (e: 'add-files', files: SimpleFileItem[]): void
  (e: 'save'): void
  (e: 'saveExecute'): void
  (e: 'delete'): void
  (e: 'close'): void
  (e: 'copy'): void
}>()

const search = defineModel<string>('search', {
  required: true,
  default: '',
})

const { urlContext } = useUrlContext()
const { isSidebarOpen } = useSidebarChecker()

const ANIMATION_DURATION_MS = 1500
const searchInputPulse = ref<boolean>(false)
/** the user can not type more than 1 character at a time */
const AUTOMATIC_INPUT_MIN_LENGTH = 2
/** add the animation class when it is an automatic input (filter by autopilot, etc...) */
watch(search, (newVal, oldVal) => {
  searchInputPulse.value =
    levenshtein(newVal, oldVal) >= AUTOMATIC_INPUT_MIN_LENGTH
})
/** remove the animation class at its end */
watch(searchInputPulse, (newVal, oldVal) => {
  if (newVal && !oldVal) {
    setTimeout(() => (searchInputPulse.value = false), ANIMATION_DURATION_MS)
  }
})

const toolbarRef = ref<InstanceType<typeof Toolbar>>()
const toolbarNode = computed(() => toolbarRef.value?.$el)

const { width: toolbarWidth } = useElementBounding(toolbarNode)
const breakpoints = useBreakpoints()

const showSmallSearchInput = ref<boolean>(
  !breakpoints.value.from1020 || isSidebarOpen.value,
)
const hideButtons = ref<boolean>(false)
const hideEditorToggle = computed(
  () => !breakpoints.value.from960 && props.editorType === 'code',
)

const expandInput = () => {
  if (!breakpoints.value.from1020 || isSidebarOpen.value) {
    showSmallSearchInput.value = false
    hideButtons.value = true
    nextTick(() => {
      searchField.value?.$el.querySelector('input')?.focus()
    })
  }
}

const shrinkSearchInput = () => {
  if (!breakpoints.value.from1020 || isSidebarOpen.value) {
    showSmallSearchInput.value = true
    hideButtons.value = false
  }
}

const searchField = ref()
onClickOutside(searchField as Ref<MaybeElement>, () => {
  shrinkSearchInput()
})

watch(breakpoints, (newBreakPoints) => {
  if (!newBreakPoints.from1020 || isSidebarOpen.value) {
    shrinkSearchInput()
  } else {
    showSmallSearchInput.value = false
  }
})

const onFocusOut = (e: FocusEvent) =>
  (e.target as HTMLInputElement).setSelectionRange(0, 0)

const VuetifyEditConfigMetadata = defineAsyncComponent(
  () => import('~/components/organisms/VuetifyEditConfigMetadata.vue'),
)

const api = useApiCore()

const otherEditor = computed(() =>
  props.editorType === 'visual'
    ? ({
        label: 'Code',
        icon: 'mdi-application-brackets-outline',
        value: 'code' satisfies EditorType,
      } as const)
    : ({
        label: 'Visual',
        icon: 'mdi-vector-polyline-edit',
        value: 'visual' satisfies EditorType,
      } as const),
)

const disableSaveWithHint = computed(() =>
  !props.hasChanges ? 'No changes' : undefined,
)
const startRunLabel = computed(() =>
  props.hasChanges ? 'Save & Execute Test Run' : 'Execute Test Run',
)
const showEditConfigPopover = ref<boolean>(false)

const showEditorPanel = ref<boolean>(false)
const editorPanelRef = ref<HTMLDivElement>()
onClickOutside(editorPanelRef, (event) => {
  event.stopPropagation()
  showEditorPanel.value = false
})
const removeEditorPanel = () => {
  if (!showEditorPanel.value) return
  showEditorPanel.value = false
}
addEventListener('resize', removeEditorPanel)
onUnmounted(() => removeEventListener('resize', removeEditorPanel))

const configStore = useConfigStore(storeContext)

const onEditMetadata = {
  confirm: async ({
    name,
    description,
  }: { name: string; description: string }) => {
    try {
      const r = await api.patchConfig({
        configId: props.config.id,
        name,
        description,
      })
      if (r.ok) {
        const config = (await r.json()) as Config
        const { name, description } = config
        configStore.push([config]) // update in place
        emit('update:config', {
          ...props.config,
          name,
          description: description ?? '',
        })
        showEditConfigPopover.value = false
      } else {
        emit('api-error', await provideRequestError(r))
      }
    } catch (e) {
      emit('api-error', useApiNetworkError() ?? '')
    }
  },
  close: () => {
    showEditConfigPopover.value = false
  },
}

const fileDialog = useFileDialog()
watchEffect(async () => {
  const { files, reset } = fileDialog
  if (files.value === null) return
  const acc: SimpleFileItem[] = []
  const { length } = files.value
  for (let i = 0; i < length; i++) {
    const newFile = files.value.item(i) as File
    const txtContent = await newFile.text()
    if (newFile.size && newFile.size > MAX_CONFIG_FILE_SIZE) {
      emit('api-error', 'File exceeds 10MB. Please upload a smaller file.')
      return
    }
    acc.push({ filename: newFile.name, content: newFile, text: txtContent }) // File uploaded regardless of the .type
  }
  emit('add-files', acc)
  reset()
})

const switchEditor = () => {
  if (props.configVersion === 'v1') {
    router.push({ query: { editor: otherEditor.value.value } })
  }
}
</script>

<style scoped lang="scss">
@use '../../styles/helpers.scss' as *;
@use '../../styles/mixins/context-menu-editor.scss' as *;

@mixin visually-hidden {
  border: 0;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute;
  white-space: nowrap;
  width: 1px;
}

// Special breakpoints for the toolbar
$bp-max-1125: 1125px;
$bp-max-1020: 1020px;
$bp-max-870: 870px;


// TODO: FrogButton does not support hiding its content responsively

.name {
  max-width: min(var(--mw), 350px);
  margin: 0 12px 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.edit-config {
  width: 400px;
}

.actions {
  justify-content: flex-end;
  flex-grow: 1;

  .search-button {
    background: #EEEEEE; // grey-lighten-3
    border-bottom: .0625rem solid rgb(var(--v-border-color));
  }
}

.editor-switch-link {
  display: inline-block;
  height: fit-content;
}

@import '../../styles/animations/heartbeat.scss';

.search {
  width: 300px;


  &.pulse-animation {
    animation: 1.5s ease-in-out 0s heartbeat;

    :deep(input) {
      background-color: #BBDEFB; // blue-lighten-4
    }
  }
}

.nowrap {
  white-space: nowrap;
}

.-from-sm {
  display: none;

  .editor-panel {
    width: var(--editor-header-panel-width);
  }

  @media screen and (max-width: $bp-max-1020) {
    display: flex;
  }
}

:global(.editor-panel) {
  height: 100%;
  width: 100%;
  overflow-y: auto;
  scroll-behavior: smooth;
}

:deep(.resize-btn) {
  display: none;
}

.toolbar--visual-editor {
  .context-menu-container {
    width: 60px !important;
    margin: 0;
  }
}

.context-menu-container {
  display: none;

  &::after {
    width: 0 !important;
    height: 0 !important;
  }

  &.sidebar-open {
    @include context-menu-editor(calc($bp-max-1125 + $sideNavigationExpandedWidth));

    @media screen and (max-width: $bp-max-870) {
      &:not(.context-menu-code-editor) {
        width: 50px !important;
        margin: 0;
      }
    }
  }

  &:not(.sidebar-open) {
    @include context-menu-editor();
  }
}

.sidebar-open.toolbar-gap.actions:has(.search-button) {
  margin: 0;
}
</style>
