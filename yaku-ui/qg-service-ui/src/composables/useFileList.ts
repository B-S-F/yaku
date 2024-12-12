// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { Ref, ref, watchEffect } from 'vue'
import { read, WorkBook } from 'xlsx'

type Files = UploadableFile[]
export const useFileList = (params: {
  file?: Ref<UploadableFile | undefined>
  multiple?: boolean
}) => {
  const files = ref<Files>([])
  watchEffect(
    () => (files.value = params.file?.value ? [params.file.value] : []),
  )
  const wb = ref<WorkBook>()

  const addFiles = async (newFiles: FileList | File[] | null) => {
    if (!newFiles) return

    if (!params.multiple) {
      files.value = []
    }

    const newUploadableFiles = Array.from(newFiles)
      .map((file) => new UploadableFile(file))
      .filter((file) => !fileExists(file.id))
    files.value = files.value.concat(newUploadableFiles)

    if (!newFiles[0]) return
    const data = await newFiles[0].arrayBuffer()
    wb.value = read(data)
  }

  const fileExists = (otherId: string) =>
    files.value.some(({ id }) => id === otherId)

  const removeFile = (file: UploadableFile) => {
    const index = files.value.indexOf(file)

    if (index > -1) files.value.splice(index, 1)
  }

  return { files, addFiles, removeFile, wb }
}

export class UploadableFile {
  file: File
  id: string
  name: string
  url: string
  status: string | null

  toJSON() {
    return {
      ...this,
      file: {
        lastModified: this.file.lastModified,
        lastModifiedDate: this.file.lastModified,
        name: this.file.name,
        size: this.file.size,
        type: this.file.type,
      },
    }
  }

  constructor(file: File) {
    this.file = file
    this.id = `${file.name}-${file.size}-${file.lastModified}-${file.type}`
    this.name = file.name
    this.url = URL.createObjectURL(file)
    this.status = null
  }
}
