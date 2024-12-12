// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { SelectItem, useId } from '@B-S-F/frog-vue'
import { MaybeRef } from '@vueuse/core'
import { computed, ref, unref } from 'vue'
import { useRouter } from 'vue-router'
import { MAIN_CONFIG_FILE } from '~/config/editor'
import { SelectItemConverter, incrementBasenameUntilAvailable } from '~/helpers'
import { splitNameAndExt } from '~/utils'

export type ID = string
export type EditorFile = {
  id: ID
  filename: string
  content?: string
}
type EditType = 'add' | 'update' | 'remove'
type Edit = { type: EditType; id: ID; filename: EditorFile['filename'] }

const files = ref<EditorFile[]>([])
const newFile = ref<EditorFile>()
const edits = ref<Edit[]>([])
const isLoaded = ref(false)

type UseEditorFilesParam = {
  init?: MaybeRef<boolean>
}
/**
 * Each file has a unique filename.
 * An ID is provided to keep track of them if they are renamed.
 * Renaming is equal to a deletion and an addition of file because the endpoint are using the filename in the URL.
 * File operations are tracked in sets (updated, added and removed) to check if a file has modification.
 * Some method bypass it to set the data from the api (with function prefix "set").
 */
// TODO: find files
export const useEditorFiles = (params: UseEditorFilesParam = {}) => {
  // reset the composale on key change to reset it globally
  const router = useRouter()
  if (params.init) {
    files.value = []
    edits.value = []
    isLoaded.value = false
  }

  const dirtyUpdate = computed(() =>
    edits.value.filter((x) => x.type !== 'remove').map((x) => x.id),
  )

  const hasChanges = computed(() => edits.value.length > 0)

  const getId = () => useId().$id('')

  const getFileById = (fileId: ID) =>
    files.value.find(({ id }) => id === fileId)

  type SetFileParams = Omit<EditorFile, 'id' | 'sourceUrl'>
  /**
   * register the file and do not track this change
   * Use case: add files that are already existing (from the api perspective)
   */
  const setFile = (params: SetFileParams) => {
    const file = {
      ...params,
      id: getId(),
    }
    files.value.push(file)
    return file
  }

  /**
   * Update file content in-place and do not track this change
   * Use case: fetch file content from the API, that is already up-to-date.
   */
  const setFileContent = ({
    id,
    content,
  }: Pick<EditorFile, 'id' | 'content'>) => {
    const atIndex = files.value.findIndex((f) => f.id === id)
    if (atIndex === -1) return
    files.value[atIndex].content = content
  }

  const addFile = (params: SetFileParams) => {
    const { id, filename } = setFile(params)
    edits.value.push({ type: 'add', id, filename })
  }

  const renameFile = (index: number, name: string): boolean => {
    const oldFile = files.value.at(index)
    if (!oldFile) return false
    edits.value.push({
      type: 'remove',
      id: oldFile.id,
      filename: oldFile.filename,
    }) // copy this string reference
    files.value[index].filename = name
    edits.value.push({ type: 'add', id: oldFile.id, filename: name })
    return true
  }

  const removeFile = (id: EditorFile['id']) => {
    const atIndex = files.value.findIndex((f) => f.id === id)
    if (atIndex === -1) return
    const { filename } = files.value.splice(atIndex, 1)[0]
    edits.value.push({ type: 'remove', id, filename })
  }

  const updateFile = (
    id: EditorFile['id'],
    updateData: Partial<EditorFile>,
  ) => {
    const atIndex = files.value.findIndex((f) => f.id === id)
    if (atIndex === -1) return
    files.value[atIndex] = {
      ...files.value[atIndex],
      ...updateData,
    }
    edits.value.push({
      type: 'update',
      id,
      filename: files.value[atIndex].filename,
    })
  }

  /**
   * This function filter the edits to remove unecessary operations.
   * For example:
   *   * add a file (add1)
   *   * remove it (remove1)
   *   * add it again (add2)
   *
   * results only in (add2).
   * It is firstly meant to avoid useless API calls and make them run without proper order.
   * So every file changes results in one API call: create, update, or delete. Renaming the file is a delete and a create.
   */
  const squashEdits = (
    editList: MaybeRef<(typeof edits)['value']> = edits,
  ): typeof edits => {
    const edits: Array<Edit & { _mark?: boolean }> = JSON.parse(
      JSON.stringify(unref(editList)),
    )
    return edits.reduce((acc, edit, editIndex) => {
      const nextOperation = edits.find((editCandidate, i) => {
        const isSameFile =
          editCandidate.id === edit.id ||
          editCandidate.filename === edit.filename
        const isANextEdit = i > editIndex
        return isSameFile && isANextEdit
      })
      if (edit._mark) return acc

      if (!nextOperation) {
        acc.push(edit)
      } else if (edit.type === 'remove' && nextOperation.type === 'add') {
        if (edit.filename !== nextOperation.filename) {
          acc.push(edit)
        } else if (edit.id !== nextOperation.id) {
          acc.push({ ...edit, type: 'update' })
          nextOperation._mark = true
        }
      } else if (edit.type === 'add') {
        if (nextOperation.type === 'remove') {
          if (edit.filename === nextOperation.filename) {
            nextOperation._mark = true
          }
        } else if (nextOperation.type === 'update') {
          acc.push(edit)
          nextOperation._mark = true
          // mark all future update as accomplished
          edits.forEach((e) => {
            if (e.id === edit.id && e.type === 'update') e._mark = true
          })
        }
      }
      return acc
    }, [] as Edit[])
  }

  const clearEdits = () => {
    edits.value = []
  }

  const getFilePreview = (label: ID) =>
    getFileById(label)?.content?.slice(0, 80) ?? ''

  const fileItems = computed(() =>
    files.value.map((f) => ({
      ...SelectItemConverter.fromEditorFile(f),
      preview: getFilePreview(f.id),
    })),
  )

  const newFileItem = computed({
    get() {
      return newFile.value
        ? {
            ...SelectItemConverter.fromEditorFile(newFile.value),
            preview: getFilePreview(newFile.value.id),
          }
        : undefined
    },
    set() {
      newFile.value = undefined
    },
  })

  /** Selected file depending of the filename query value in the URL */
  const selectedFile = ref<SelectItem<string>>()

  const filesWithError = ref<Map<string, number>>(new Map())

  // -----------------
  //  File operations
  // -----------------
  const onFileDelete = async (id: string) => {
    const file = getFileById(id)
    if (!file) return
    removeFile(file.id)
    filesWithError.value.delete(file.filename)
    // reset the focus to the main file if this file gets deleted
    if (selectedFile.value?.value === id)
      router.replace({ query: { filename: MAIN_CONFIG_FILE, editor: 'code' } })
  }

  const onFileCopy = (fileItem: SelectItem<string>) => {
    const file = getFileById(fileItem.value)
    if (!file) return
    const newFile = JSON.parse(JSON.stringify(file)) as typeof file // deep copy to avoid references
    const { basename, ext } = splitNameAndExt(file.filename)
    // add the -copy suffix before the extension, or increment the file
    const newName = basename.match(/-copy(-\d+)?$/)
      ? incrementBasenameUntilAvailable(
          file.filename,
          files.value.map((f) => splitNameAndExt(f.filename)),
        )
      : `${basename}-copy.${ext}`
    newFile.filename = newName
    addFile(newFile) // add the file only locally in the UI first
  }

  const onFileRename = (
    fileItem: SelectItem,
    newName: string,
    callback?: (newName: string) => void,
  ) => {
    if (newFile.value) {
      callback?.(newName)
      newFile.value = undefined
    } else {
      const i = files.value.findIndex(({ id }) => id === fileItem.value)
      if (i === -1 || fileItem.label === newName) return
      renameFile(i, newName)
    }
  }

  return {
    files,
    newFile,
    hasChanges,
    isLoaded,
    dirtyUpdate,
    edits,
    squashEdits,
    clearEdits,
    getFileById,
    getId,
    setFile,
    setFileContent,
    addFile,
    removeFile,
    updateFile,
    renameFile,
    newFileItem,
    getFilePreview,
    fileItems,
    selectedFile,
    filesWithError,
    onFileCopy,
    onFileDelete,
    onFileRename,
  }
}
