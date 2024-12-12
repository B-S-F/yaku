<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <VuetifyCodeEditorLayout tag="div" :showError="!!apiError" :isResizing="isResizingEditPanel || isResizingCodePanel"
    :expandRightPanel="showCodePanel"
    :style="{ '--edit-panel-width': editPanelManualWidth, '--code-panel-width': codePanelManualWidth }">
    <template #left-panel>
      <VuetifyEditorEditPanel ref="editPanelRef" class="editor-edit-panel" :files="fileItems"
        :updatedFiles="dirtyUpdate" :errorFiles="filesWithError" :new-file="newFileItem" :notifBar="notifBar"
        :selectedFileId="selectedFile?.value" @abort-new-file="newFile = undefined"
        @add-files="emit('add-files', $event)" @drag-resizer="setResize" @copy-file="onFileCopy"
        @rename-file="handleFileRename" @delete-file="onFileDelete" />
    </template>

    <template #editor>
      <header class="editor-header">
        <h2 class="text-h6 font-weight-bold">
          Code
        </h2>
        <FrogButton class="panel-toggle" secondary
          :icon="showCodePanel ? 'mdi-chevron-double-right' : 'mdi-chevron-double-left'" data-cy="panel-toggle"
          @click="showCodePanel = !showCodePanel">
          {{ showCodePanel ? 'Hide App/Autopilots' : 'Show App/Autopilots' }}
        </FrogButton>
      </header>
      <Suspense>
        <VuetifyMonacoEditor v-if="selectedFile" :key="apiError" class="editor" :value="currentBuffer"
          :filename="selectedFile.label ?? ''" :theme="editorTheme" :language="editorLanguage" :options="editorOpts"
          width="100%" height="100%" @change="onEditorChange" @editorDidMount="onEditorDidMount"
          @fileErrorAmount="onFileErrorEditorUpdate" />
        <template #fallback>
          <div class="editor place-center">
            <FrogActivityIndicator />
          </div>
        </template>
      </Suspense>
    </template>

    <template #error>
      <FrogNotificationBar class="error-bar" :show="!!apiError" type="error" fullWidth withIcon centerIcon
        noContentMargin>
        <VuetifyBannerContent :label="apiError" @close="emit('update:apiError', undefined)" />
      </FrogNotificationBar>
    </template>

    <template #right-panel>
      <VuetifyEditorCodePanel ref="codePanelRef" v-model:expand="showCodePanel" class="code-panel"
        :class="{ 'expand': showCodePanel }" @drag-resizer="setCodePanelResizer"
        @add-autopilot="AutopilotSnippet.addAutopilotToFile" />
    </template>

    <template #teleport>
      <VuetifyBlurBackground v-if="showAddSecretDialog">
        <VuetifyEditSecretDialog actionType="create" :errorMsg="apiError" @create="onAddSecret"
          @close="showAddSecretDialog = false" />
      </VuetifyBlurBackground>
    </template>
  </VuetifyCodeEditorLayout>
</template>

<script setup lang="ts">
import type { SelectItem } from '@B-S-F/frog-vue'
import {
  useDebounceFn,
  useLocalStorage,
  useResizeObserver,
  useWindowSize,
} from '@vueuse/core'
import type { editor } from 'monaco-editor'
import * as monacoEditor from 'monaco-editor'
import {
  computed,
  defineAsyncComponent,
  ref,
  shallowRef,
  watch,
  watchEffect,
} from 'vue'
import { useRoute } from 'vue-router'
import type { SecretPost, SingleCheck } from '~/api'
import type EditorCodePanel from '~/components/organisms/EditorCodePanel.vue'
import type EditorEditPanel from '~/components/organisms/EditorEditPanel.vue'
import {
  useAutopilotSnippet,
  useEditorTestRun,
  useMonacoYaml,
  useSchemasInYamlEditor,
  useSecretCompletion,
} from '~/composables/editor'
import { useJumpToCode } from '~/composables/useJumpToCode'
import { useSecretStore } from '~/store/useSecretStore'
import type {
  CodeJump,
  EditorFileErrorUpdate,
  SimpleFileItem,
} from '~/types/Editor'
import { getElementOrFirstInArray } from '~/utils'
import { storeContext } from '~api'
import type { ID } from '~composables'
import {
  useColorScheme,
  useEditorFiles,
  useEditorKeyboard,
  useResizeDnD,
  type useFileNotifBar,
} from '~composables'
import {
  getCharAtCursor,
  getCodeFromSecret,
  insertTextAtCursor,
  SelectItemConverter,
} from '~helpers'

const props = defineProps<{
  configId: number
  notifBar: ReturnType<typeof useFileNotifBar>['notifBar']['value']
  apiError?: string
  jump?: CodeJump
}>()

const emit = defineEmits<{
  (e: 'add-files', files: SimpleFileItem[]): void
  (e: 'update:apiError', msg: string | undefined): void
  (e: 'update:isFileError', hasError: boolean): void
  /** pass it to visual editor */
  (e: 'update:hasChanges', hasChanges: boolean): void
  /** pass it to visual editor */
  (e: 'update:disableExecuteWithHint', hint: string | undefined): void
  (e: 'update:jump', clear: undefined): void
  (e: 'save'): void
  (e: 'start-test-run', payload: SingleCheck): void
}>()

const EditSecretDialog = defineAsyncComponent(
  () => import('~/components/organisms/VuetifyEditSecretDialog.vue'),
)

const {
  files,
  newFile,
  dirtyUpdate,
  hasChanges,
  isLoaded,
  getFileById,
  updateFile,
  fileItems,
  selectedFile,
  filesWithError,
  onFileRename,
  onFileCopy,
  onFileDelete,
} = useEditorFiles()
const handleFileRename = (fileItem: SelectItem, newName: string) =>
  onFileRename(fileItem, newName, (newName) =>
    emit('add-files', [
      {
        filename: newName,
        content: `# ${newName}`,
      },
    ]),
  )
watchEffect(() => emit('update:hasChanges', hasChanges.value))

const getFilePreview = (label: ID) =>
  getFileById(label)?.content?.slice(0, 80) ?? ''

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
const route = useRoute()
watchEffect(() => {
  const filename = getElementOrFirstInArray(route.query.filename)
  if (selectedFile.value && selectedFile.value.label === filename) return
  const fileCandidate = fileItems.value.find((f) => f.label === filename)
  selectedFile.value = fileCandidate ? fileCandidate : fileItems.value[0]
})

/** TODO: it may be useful to store it somewhere else than the localStorage */
const editPanelRef = ref<InstanceType<typeof EditorEditPanel>>()
const editPanelManualWidth = useLocalStorage('editor-edit-panel', '14%')
const onEditPanelResize = ({ clientX }: MouseEvent) => {
  if (!editPanelRef.value) return
  const originX = editPanelRef.value.$el.getBoundingClientRect().x
  editPanelManualWidth.value = `${Math.max(200, Math.min(clientX - originX, 400))}px`
  resizeEditorToContainer()
}
const { setResize, isResizing: isResizingEditPanel } = useResizeDnD({
  onResize: onEditPanelResize,
})

const showCodePanel = ref(false)
const codePanelRef = ref<InstanceType<typeof EditorCodePanel>>()
const codePanelManualWidth = useLocalStorage('editor-code-panel', '400px')
const onCodePanelResize = ({ clientX }: MouseEvent) => {
  if (!codePanelRef.value) return
  const originX = codePanelRef.value.$el.getBoundingClientRect().right
  codePanelManualWidth.value = `${Math.max(200, Math.min(originX - clientX, 600))}px`
  resizeEditorToContainer()
}
const { setResize: setCodePanelResizer, isResizing: isResizingCodePanel } =
  useResizeDnD({
    onResize: onCodePanelResize,
  })
watch(showCodePanel, () => resizeEditorToContainer())

// --------
//  Editor
// --------
/** is set only after the onEditorDidMount hook is called */
const editorRef = shallowRef<editor.IStandaloneCodeEditor>()
const { schemas } = useSchemasInYamlEditor({ files, areAvailable: isLoaded })
const { refresh: refreshYamlLS } = useMonacoYaml({
  monacoEditor,
  schemas,
})
watch(selectedFile, (newVal, oldVal) => {
  if (newVal?.value === oldVal?.value) return
  refreshYamlLS()
})
const onEditorDidMount = async (editor: editor.IStandaloneCodeEditor) => {
  editorRef.value = editor

  AutopilotSnippet.bindEditor(editor)

  // it will be called only on first load
  editor.onDidChangeModelContent(() => {
    if (props.jump) {
      useJumpToCode(editor, props.jump, {
        onEnd: () => emit('update:jump', undefined),
      })
    }
  })

  // Update the secrets to get the last up to date list.
  const secretOpResult = await secretStore.getSecrets()
  if (!secretOpResult.ok) emit('update:apiError', secretOpResult.error.msg)

  useSecretCompletion({
    secrets: computed(() => secretStore.secrets),
    editor,
    onAddSecret: () => {
      showAddSecretDialog.value = true
    },
  })
  useEditorTestRun({
    editor,
    callback: (singleCheck) => emit('start-test-run', singleCheck),
  })
}

// make the code editor reactive if we jump from the current CONFIG_EDIT view
watchEffect(() => {
  if (editorRef.value && props.jump) {
    useJumpToCode(editorRef.value, props.jump, {
      onEnd: () => emit('update:jump', undefined),
    })
  }
})

// force resize if an error shows up under the editor, or if the window size changes
const resizeEditorToContainer = () =>
  setTimeout(
    () =>
      editorRef.value?.layout(
        editorRef.value.getDomNode()?.getBoundingClientRect(),
      ),
    0,
  )
const mainRef = ref<HTMLDivElement>()
useResizeObserver(mainRef, resizeEditorToContainer)
const windowSize = useWindowSize()
watch(() => [props.apiError, windowSize.width], resizeEditorToContainer, {
  flush: 'post',
})

const { colorScheme } = useColorScheme()
const editorTheme = computed(() =>
  colorScheme.value === 'dark' ? 'vs-dark' : 'vs',
)
const editorOpts: editor.IStandaloneEditorConstructionOptions = {}

const SUPPORTED_EXTENSION = ['yaml', 'json']
const editorLanguage = computed(() => {
  const ext = selectedFile.value?.label.split('.').at(-1) ?? ''
  return SUPPORTED_EXTENSION.includes(ext) ? ext : undefined
})

/** Accessor to the expected file content */
const currentBuffer = computed({
  get() {
    return getFileById(selectedFile.value!.value)?.content ?? '' // selectedFile is always defined
  },
  set(v) {
    const fileId = selectedFile.value?.value
    if (!fileId) return
    const fileBuffer = getFileById(fileId)
    if (!fileBuffer) return
    // update the file stored in the background
    updateFile(fileId, {
      content: v,
    })
  },
})
const onEditorChange = (e: string) => {
  currentBuffer.value = e
}

const AutopilotSnippet = useAutopilotSnippet({
  currentFile: currentBuffer,
})
/** debounce this function to avoid a flickering */
const onFileErrorEditorUpdate = useDebounceFn(
  ({ filename, value }: EditorFileErrorUpdate) => {
    if (value > 0) {
      filesWithError.value.set(filename, value)
    } else {
      filesWithError.value.delete(filename)
    }
    emit('update:isFileError', filesWithError.value.size > 0)
  },
  400,
)
const disableExecuteWithHint = computed(() => {
  if (filesWithError.value.size === 0) return undefined
  const s =
    filesWithError.value.size === 1 &&
    filesWithError.value.values().next().value === 1
      ? ''
      : 's'
  return `Please solve the error${s} in: ${[...filesWithError.value.keys()].join(', ')}`
})
watchEffect(() =>
  emit('update:disableExecuteWithHint', disableExecuteWithHint.value),
)

// --------------------
//  Keyboard shortcuts
// --------------------
useEditorKeyboard({
  triggers: [
    {
      trigger: (e) => (e.metaKey || e.ctrlKey) && e.code === 'KeyS',
      action: () => emit('save'),
    },
  ],
})

// ---------
//  Secrets
// ---------
const secretStore = useSecretStore(storeContext)

const showAddSecretDialog = ref(false)
/** Must be called only after the editor is mounted. */
const onAddSecret = async (payload: SecretPost) => {
  const result = await secretStore.createSecret(payload)
  if (result.ok) {
    const secret = result.resource
    const charInserted = getCharAtCursor(editorRef.value!)
    const endingChar = '}'
    const secretEnv = getCodeFromSecret(secret.name, {
      withRightBracket: charInserted !== endingChar,
    })
    insertTextAtCursor(
      editorRef.value!,
      secretEnv,
      'create secret after creation',
    )
    showAddSecretDialog.value = false
  } else {
    const { msg } = result.error
    emit('update:apiError', msg)
  }
}
</script>

<style scoped lang="scss">
@use '../../styles/_abstract.scss' as *;

.place-center {
  display: grid;
  place-content: center;
}

.editor-edit-panel {
  height: 100%;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  column-gap: 32px;
  padding: 16px 16px 24px 16px;

  h2 {
    margin: 0;
  }

  .panel-toggle {
    margin-left: auto;
    align-items: center;
    min-width: 0;

    :deep(.v-btn__content) {
      @extend %inline-ellipsis;
    }
  }
}

.editor {
  & :deep(.monaco-editor) {
    width: 100% !important;
    height: 100% !important;
  }

  & :deep(.monaco-editor > .overflow-guard) {
    width: 100% !important;
    height: 100% !important;
  }
}

.code-editor-layout {
  :deep(.left-panel) {
    border-right: 0.0625rem solid rgb(var(--v-border-color));
  }

  :deep(.right-panel) {
    border-left: 0.0625rem solid rgb(var(--v-border-color));
  }
}
</style>
