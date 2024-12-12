<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <FrogDropzone v-slot="{
    dropZoneActive
  }" class="file-upload" @dropped="onDrop">
    <v-file-input :label="fileLabel" :dirty="hasFile" :accept="accept" :focused="dropZoneActive" :multiple="multiple"
      persistent-clear @update:modelValue="onInputChange" />
  </FrogDropzone>
</template>

<script setup lang="ts">
import FrogDropzone from './FrogDropzone.vue'

type FileUploadProps = {
  hasFile?: boolean
  multiple?: boolean
  accept?: string
  fileLabel?: string
}
const props = defineProps<FileUploadProps>()
const emit = defineEmits<{
  (e: 'add', files: File[] | null): void
  /** Emitted if a file does not match the accept prop requirement */
  (e: 'addNotSupported'): void
  (e: 'remove'): void
}>()

const filterFileByExtension = (files: File[]) => {
  const acceptedFiles = props.accept
  if (!acceptedFiles) {
    return files
  }
  const okFiles = files.filter((file) =>
    acceptedFiles.includes(file.name.split('.').at(-1) ?? '..'),
  )
  if (okFiles.length !== files.length) emit('addNotSupported')
  return okFiles
}

const onDrop = (e: DragEvent) => {
  if (!e.dataTransfer) return
  const files = e.dataTransfer.files
  if (!files) return
  emit('add', filterFileByExtension(Array.from(files)))
}

const onInputChange = (files: File | File[]) => {
  if (typeof files !== 'undefined') {
    emit('add', filterFileByExtension(Array.isArray(files) ? files : [files]))
  }
}
</script>

<style lang="scss" scoped>
.file-upload {
  height: 100%;

  &>* {
    height: 100%;
  }
}
</style>
