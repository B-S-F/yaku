<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <section class="edit-panel">
    <header>
      <h2 class="heading text-h2 font-weight-bold">
        Files
      </h2>
    </header>
    <ul class="semantic-list file-list">
      <template v-for="file in files" :key="file.value">
        <li role="none" class="a-menu-item">
          <VuetifyFileItem role="menuitem" :to="{ query: { filename: file.label, editor: 'code' } }"
            :filename="file.label" :preview="file.preview"
            :errorMsg="file.value === renameError?.id ? renameError.errorMsg : undefined"
            :isModified="updatedFiles.includes(file.value)" :errorAmount="errorFiles.get(file.label)"
            :isSelected="file.value === selectedFileId" :disableRename="isMainFile(file.label)"
            :disableCopy="isMainFile(file.label)" :disableDelete="isMainFile(file.label)" data-cy="file-item"
            @rename="onRename(file, $event)" @copy="emit('copy-file', file)"
            @nameChange="onNameChange(file.value, $event)" @delete="showDeleteDialogOfFile = file.label" />
        </li>
        <Teleport to="#app">
          <VuetifyScreenCenter v-show="showDeleteDialogOfFile && file.label === showDeleteDialogOfFile">
            <VuetifyDeleteFileDialogConfirmation :showDialog="!!showDeleteDialogOfFile" :filename="file.label"
              @close="showDeleteDialogOfFile = null" @confirm="onFileDeleteConfirm(file)" />
          </VuetifyScreenCenter>
        </Teleport>
        <hr>
      </template>
      <template v-if="newFile">
        <li role="none">
          <VuetifyFileItem ref="newFileItem" role="menuitem" :to="{}" :filename="newFile.label" preview=""
            :errorMsg="newFile.value === renameError?.id ? renameError.errorMsg : undefined" :errorAmount="0"
            :isSelected="newFile.value === selectedFileId" :disableRename="true" :disableCopy="true"
            :disableDelete="true" data-cy="file-item" @rename="onFileCreate($event)"
            @renameAbort="emit('abort-new-file')" @nameChange="onNameChange(newFile.value, $event)" />
        </li>
        <hr>
      </template>
    </ul>
    <FrogNotificationBar class="notif-bar" withIcon fullWidth :show="!!notifBar" :type="notifBar?.type ?? 'neutral'"
      :customIcon="notifBar?.customIcon">
      {{ notifBar?.label }}
    </FrogNotificationBar>
    <FrogButton class="resize-btn bg-grey-lighten-2" integrated arial-label="resize panel"
      icon="mdi-arrow-split-vertical" @mousedown="emit('drag-resizer')" />
  </section>
</template>

<script setup lang="ts">
import { defineAsyncComponent, ref, watchEffect } from 'vue'
import type FileItem from '~/components/molecules/FileItem.vue'
import { MAIN_CONFIG_FILE } from '~/config/editor'
import type { SelectItem, SimpleFileItem } from '~/types'

type FilePanelItem = SelectItem<string> & { preview: string }

const props = defineProps<{
  files: FilePanelItem[]
  newFile?: FilePanelItem
  selectedFileId?: string
  /** contains the file ids of updated files */
  updatedFiles: string[]
  /** contains the file name as key with the amount of error(s) in the file as value */
  errorFiles: Map<string, number>
  notifBar?: {
    type: 'warning' | 'error' | 'success' | 'info' | 'neutral'
    label: string
    customIcon?: string
  }
}>()

const emit = defineEmits<{
  (e: 'add-files', files: SimpleFileItem[]): void
  (e: 'copy-file', file: FilePanelItem): void
  (e: 'delete-file', id: string): void
  (e: 'rename-file', file: FilePanelItem, newName: string): void
  (e: 'drag-resizer'): void
  (e: 'abort-new-file'): void
}>()

const VuetifyDeleteFileDialogConfirmation = defineAsyncComponent(
  () =>
    import('~/components/organisms/VuetifyDeleteFileDialogConfirmation.vue'),
)

const showDeleteDialogOfFile = ref<string | null>(null)
const onFileDeleteConfirm = (file: FilePanelItem) => {
  showDeleteDialogOfFile.value = null
  emit('delete-file', file.value)
}

const isMainFile = (filename: string) => filename === MAIN_CONFIG_FILE

const renameError = ref<{ id: string; errorMsg: string }>()
const onNameChange = (value: string, newName: string) => {
  const isTakenByOtherFile = props.files.find(
    (f) => f.label === newName && f.value !== value,
  )
  renameError.value = isTakenByOtherFile
    ? { id: value, errorMsg: 'The filenames must be unique' }
    : undefined
}
const onRename = (file: FilePanelItem, newName: string) => {
  if (!renameError.value) emit('rename-file', file, newName)
}

const newFileItem = ref<InstanceType<typeof FileItem>>()
const onFileCreationStart = (newFile: FilePanelItem) => {
  if (!newFileItem.value) return

  onNameChange(newFile.value, newFile.label) // check if the name exists
  newFileItem.value.toggleEditName(true) // handle the rest in onRename()
}
watchEffect(
  () => {
    if (props.newFile) onFileCreationStart(props.newFile)
  },
  { flush: 'post' },
)

const onFileCreate = (filename: string) => {
  emit('add-files', [{ filename, content: `# ${filename}` }])
  emit('abort-new-file')
}
</script>

<style scoped lang="scss">
.edit-panel {
  display: grid;
  grid-template-rows: auto auto auto 1fr; // the last row is not used, but take spaces
  grid-template-columns: 1fr minmax(0, auto);
  row-gap: 24px;
  position: relative;

  // the last element is the resizer, so we use the first element and the last one
  // (except the resizer) to set the padding.
  >*:first-child {
    padding-top: 16px;
  }

  >*:nth-child(-2) {
    padding-bottom: 16px;
  }
}

// .actions
header,
.file-list,
.notif-bar {
  grid-column: 1 / 2;
}

.edit-panel-resizer {
  grid-row: 1 / -1;
  grid-column: 2 / 3;
}

// --- END LAYOUT ---

header {
  display: flex;
  justify-content: space-between;
  margin: 0 16px;
  column-gap: 8px;
  align-items: center;
  container-type: inline-size;
  container-name: header;
}

.heading {
  margin: 0.5rem 0 0 0;
  align-self: start;
}

.file-list {
  padding: 0;
  overflow-y: auto;
}

.notif-bar {
  margin-top: 24px;
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
}

.resize-btn {
  $width: 0.9rem;
  $height: 5.4rem;
  padding-top: 5rem;
  padding-bottom: 5rem;
  position: absolute;
  right: 0;
  top: calc(50% - #{$height * 0.5});
  width: $width;
  height: $height;
  cursor: ew-resize;
  border: none;
  border-radius: 4px;
  font-size: xx-small;

  --handle-color: #0D47A1; // blue-darken-4

  &:hover {
    --handle-color: #000000;
  }

  &:active {
    --handle-color: #000000;
  }

  &::before,
  &::after {
    $handleHeight: 0.5rem;
    display: block;
    position: absolute;
    width: 1px;
    height: $handleHeight;
    background-color: var(--handle-color);
    transform: translate(calc($width * 0.5 + var(--from-x-center)), #{($height - $handleHeight) * 0.5})
  }

  &::before {
    --from-x-center: -2px;
  }

  &::after {
    --from-x-center: 0px;
  }
}

:global(.side-panel-resize-popover) {
  --y-shift: 16px;
}
</style>
