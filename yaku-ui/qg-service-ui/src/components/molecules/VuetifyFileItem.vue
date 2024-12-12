<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <RouterLink ref="fileItemRef" :to="to" class="file" :class="{ '--selected': isSelected }" tabindex="0">
    <FrogPopover attached tooltipAlike triggerOnHover pophoverClass="state-popover popover-content-inline"
      arrowPlacementClass="-without-arrow-top">
      <FrogIcon :class="{
        'color-error': errorAmount > 0,
        'color-info': isModified && errorAmount === 0,
      }" :icon="stateIcon" data-cy="state-icon" />
      <template #content>
        <div v-if="errorAmount > 0" class="state-icon-legend bg-error">
          This file contains <span>{{ errorAmount }}</span> error{{ errorAmount > 1 ? 's' : '' }}.
          Resolve them to enable executing a
          test run.
        </div>
        <div v-else-if="isModified" class="state-icon-legend">
          This file contains unsaved changes.
        </div>
      </template>
    </FrogPopover>
    <FrogPopover v-if="!isEditingName" class="filename-tooltip" pophoverClass="filename-popover" attached triggerOnHover
      tooltipAlike arrowPlacementClass="-without-arrow-top" :label="filename" :deactivate="!shouldShowPopover">
      <VuetifyTruncableText class="filename" :label="filename" :truncateAt="Math.max(0, filename.lastIndexOf('.') - 4)"
        @isTruncated="shouldShowPopover = $event" />
    </FrogPopover>
    <FrogTextInput v-else :id="filename" ref="textInputRef" v-model="localName" class="filename-field"
      data-cy="name-input" @keypress.enter="$event.target.blur()" @keydown.esc="onRenameAbort"
      @blur="onRenameConfirm" />
    <span class="file-preview text-body-1">{{ preview }}</span>
    <FrogNotificationBar :show="showErrorMsg" class="notif-bar" type="error" full-width with-icon center-icon
      no-content-margin>
      {{ errorMsg }}
    </FrogNotificationBar>
    <FrogPopover v-if="!isAllMenuItemDisabled" v-show="!showErrorMsg" class="context-menu" attached tooltipAlike
      arrowPlacementClass="-top-center" pophoverClass="popover-content-inline" :show="showContextMenu">
      <FrogButton integrated :disabled="isEditingName" :icon="showContextMenu ? 'mdi-close' : 'mdi-dots-horizontal'"
        data-cy="menu-button" @click.prevent="toggleContextMenu()" />
      <template #content>
        <ul class="semantic-list menu">
          <li tabindex="0" :class="{ 'disabled': disableDelete }"
            :title="disableDelete ? 'This main file can not be renamed.' : ''" data-cy="rename-button"
            @click.prevent="onRename" @keydown.enter.prevent="onRename">
            <FrogIcon icon="mdi-file-edit-outline" />
            <span>Rename</span>
          </li>
          <li tabindex="0" :class="{ 'disabled': disableDelete }"
            :title="disableDelete ? 'This main file should not be duplicated.' : ''" data-cy="duplicate-button"
            @click.prevent="onCopy" @keydown.enter.prevent="onCopy">
            <FrogIcon icon="mdi-file-document-multiple-outline" />
            Duplicate
          </li>
          <li tabindex="0" :class="{ 'disabled': disableDelete }"
            :title="disableDelete ? 'This main file can not be deleted.' : ''" data-cy="delete-button"
            @click.prevent="onDelete" @keydown.enter.prevent="onDelete">
            <FrogIcon icon="mdi-delete-outline" />
            Delete
          </li>
        </ul>
      </template>
    </FrogPopover>
  </RouterLink>
</template>

<script setup lang="ts">
import { FrokComponents } from '@B-S-F/frog-vue'
import { onClickOutside } from '@vueuse/core'
import { useToggle } from '@vueuse/shared'
import { computed, ref, watch, watchEffect } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

type FileItemProps = {
  filename: string
  errorMsg?: string
  preview?: string
  to: RouteLocationRaw
  isModified?: boolean
  errorAmount?: number
  isSelected?: boolean
  disableDelete?: boolean
  disableCopy?: boolean
  disableRename?: boolean
}
const props = withDefaults(defineProps<FileItemProps>(), {
  preview: '',
  errorAmount: 0,
})
const emit = defineEmits<{
  (e: 'rename', newName: string): void
  (e: 'renameAbort'): void
  (e: 'delete'): void
  (e: 'copy'): void
  (e: 'nameChange', newName: string): void
}>()

const [showContextMenu, toggleContextMenu] = useToggle(false)
const [isEditingName, toggleEditName] = useToggle(false)

const isAllMenuItemDisabled = computed(
  () => props.disableCopy && props.disableDelete && props.disableRename,
)

const showErrorMsg = computed(() => props.errorMsg !== undefined)

// hide context menu
watchEffect(() => {
  if (isEditingName.value) {
    toggleContextMenu(false)
  }
})
const fileItemRef = ref<InstanceType<typeof HTMLElement>>()
onClickOutside(fileItemRef, () => toggleContextMenu(false))

const textInputRef = ref<InstanceType<FrokComponents['FrokTextInput']>>()
// autofocus input on toggleEditName
watchEffect(() => {
  if (textInputRef.value && isEditingName.value) {
    textInputRef.value.$el.querySelector('input')?.focus()
  }
})

const shouldShowPopover = ref(false)

const stateIcon = computed(() => {
  if (props.errorAmount > 0) return 'mdi-alert-octagon-outline'
  if (props.isModified) return 'mdi-information-outline'
  return (props.preview?.length ?? 0) > 0
    ? 'mdi-file-document-outline'
    : 'mdi-file-outline'
})

const localName = ref(props.filename)
watchEffect(() => (localName.value = props.filename))
watch(localName, (newName, oldName) => {
  if (newName !== oldName) {
    emit('nameChange', newName)
  }
})

const emitAndClose = (e: 'delete' | 'copy') => {
  emit(e as any)
  toggleContextMenu(false)
}
// -----------------
//  Context Actions
// -----------------
const onRename = () => {
  if (!props.disableRename) {
    toggleEditName(true)
  }
}
const onRenameConfirm = () => {
  toggleEditName(false)
  if (showErrorMsg.value || localName.value.trim().length === 0) {
    onRenameAbort()
  } else {
    emit('rename', localName.value)
  }
}
const onRenameAbort = () => {
  toggleEditName(false)
  localName.value = props.filename
  emit('renameAbort')
}

const onCopy = () => emitAndClose('copy')
const onDelete = () => {
  if (!props.disableDelete) {
    emitAndClose('delete')
  }
}

defineExpose({
  toggleEditName,
})
</script>

<style scoped lang="scss">
@use '../../styles/_abstract.scss' as *;
@use '../../styles/tokens.scss' as *;


.file {
  display: grid;
  grid-template-rows: auto 1fr auto;
  grid-template-columns: auto 1fr auto;
  column-gap: 0.25rem;
  padding: 0.5rem;
  padding-inline-start: 0;
  width: 100%;
  color: black;

  &:hover,
  &:focus-within {
    background-color: #BBDEFB; // blue-lighten-4

    .-dark-mode & {
      background-color: #0D47A1; // blue-darken-4
    }

    .context-menu {
      visibility: visible;
    }
  }

  &.--selected {
    background-color: #90CAF9; // blue-lighten-3

    .-dark-mode & {
      background-color: #1565C0; // blue-darken-3
    }

    .filename {
      font-weight: 700;
    }
  }

  .file-preview {
    grid-area: 2 / 2 / 3 / 3;
    color: #757575; // grey-darken-1

    .-dark-mode & {
      color: #EEEEEE; // grey-lighten-3
    }
  }

  .notif-bar {
    grid-area: 2 / 1 / 3 / 4;
  }
}

.filename-tooltip {
  overflow-x: hidden; // hide the filename block

  .filename :deep(span) {
    // block in order to take the maximum amount of space for the JS API
    text-decoration: none;
  }
}

:global(.filename-popover) {
  --y-shift: 6px;
  --x-shift: 30px;
}

:global(.state-popover) {
  --y-shift: 6px;
  --x-shift: calc(50% - 1.275rem);
}

:global(.state-icon-legend) {
  padding: 0.25rem 0.75rem;
}

:deep(.filename-field) {
  height: auto;

  input {
    padding: 0 2px;
    height: auto;
  }
}

.color-error {
  color: #F44336; // red
}

.color-info {
  color: #2196F3; // blue
}

.bg-error {
  background-color: #FFCDD2; // red-lighten-4 /
}

.context-menu {
  visibility: hidden;
  grid-area: 1 / 3 / -1 / -1;
  align-self: center;
}

ul.menu {
  position: relative;
  z-index: 3;

  &>li {
    display: flex;
    column-gap: 8px;
    width: 240px;
    padding: 12px;

    &:not(.disabled) {

      &:hover,
      &:focus {
        cursor: pointer;
        background-color: #EEEEEE; // grey-lighten-3
      }

      &:active {
        background-color: #E0E0E0; // grey-lighten-2
      }
    }

    &.disabled {
      color: #9E9E9E; // grey
      cursor: not-allowed;
    }
  }
}

.file-preview {
  height: 1.5rem; // 1rem + line-height 1.5
  text-decoration: none;
  @extend %inline-ellipsis;
}

.notif-bar {
  padding: $spacing-4 $spacing-12 $spacing-4 $spacing-16;

  :deep(.v-alert) {
    height: 1.5rem; // 1rem + line-height 1.5
  }

  :deep(.v-alert__text) {
    width: 100%;
  }
}
</style>
