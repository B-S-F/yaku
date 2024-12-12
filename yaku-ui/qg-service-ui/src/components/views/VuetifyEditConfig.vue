<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <main class="editor-layout span-12" :class="{ '--visual': editorType === 'visual' }">
    <VuetifyEditorHeader v-model:config="config" v-model:search="search" class="header" :configVersion="configVersion"
      :editorType="editorType" :hasChanges="hasChanges" :disableExecuteWithHint="disableExecuteWithHint"
      @api-error="apiError = $event" @create-file="onCreateFile" @add-files="onFileAdd" @copy="configToCopy = config.id"
      @delete="configToDelete = config" @save="onSave(configIdParam)" @save-execute="onSaveAndExecute(configIdParam)"
      @close="onClose(configIdParam)">
      <template #panel>
        <VuetifyContentNavigation v-if="editorType === 'visual'" headingLabel="Chapters" headingTag="h2"
          headingDesc="Overview of the chapters & added apps" withAutopilots withGlobalVariables
          :selected="currentContent" :contentItems="contentNavItems" />
        <VuetifyEditorEditPanel v-else :files="fileItems" :updatedFiles="dirtyUpdate" :errorFiles="filesWithError"
          :new-file="newFileItem" :notifBar="notifBar" :selectedFileId="selectedFile?.value" :adjustable="false"
          @abort-new-file="newFile = undefined" @add-files="onFileAdd" @copy-file="onFileCopy"
          @rename-file="onFileRename" @delete-file="onFileDelete" />
      </template>
    </VuetifyEditorHeader>

    <VuetifyVisualEditor v-if="editorType === 'visual' && configContent" v-model:config="qgConfig"
      v-model:search="search" :varsToReplace="varsToReplace" class="visual-editor" :hasChanges="hasChanges"
      :isRunningTestRun="testRun.isRunning" @save="onSave(configIdParam)" @close="onClose(configIdParam)"
      @save-execute="onSaveAndExecute(configIdParam)" @start-test-run="onTestRunStart" />

    <VuetifyCodeEditor v-else-if="editorType === 'code'" v-model:apiError="apiError" v-model:isFileError="isFileError"
      v-model:jump="jump" class="code-editor" :configId="configIdParam" :notifBar="notifBar"
      @update:disableExecuteWithHint="disableExecuteWithHint = $event" @add-files="onFileAdd"
      @save="onSave(configIdParam)" @start-test-run="onTestRunStart" />
    <Teleport to="#app">
      <VuetifyCloseEditConfigDialog v-if="showExitDialog" @abort="onAbort(showExitDialog)"
        @close="showExitDialog = undefined" @confirm="saveAndClose(configIdParam, { to: showExitDialog })" />
      <VuetifyProcessingActionIndicator v-show="editorState === 'saving'" label="Configuration is saved..." />
      <VuetifyProcessingActionIndicator v-show="editorState === 'adding'" label="The file(s) are uploaded..." />
      <VuetifyProcessingActionIndicator v-show="editorState === 'starting-run'" label="Configuration is executed..." />
      <VuetifyScreenCenter v-if="addDuplicateFileDialog.isRevealed.value && duplicateFilename">
        <VuetifyConfirmDialog v-bind="AddFileDuplicate.toProps(duplicateFilename)"
          @confirm="addDuplicateFileDialog.confirm" @cancel="addDuplicateFileDialog.cancel" />
      </VuetifyScreenCenter>
      <VuetifyScreenCenter v-if="configToDelete">
        <VuetifyDeleteConfigurationConfirmation :config-name="configToDelete?.name ?? ''" @confirm="onConfigDelete"
          @cancel="configToDelete = null" />
      </VuetifyScreenCenter>
      <VuetifyScreenCenter v-if="configToCopy" v-show="configToCopy">
        <VuetifyCopyConfigDialog :config-id="configToCopy" @close="onFinishCopying" />
      </VuetifyScreenCenter>
      <VuetifyTestRunPanel v-if="testRun.show" v-model:open="testRun.show" :testRuns="testRun.runs"
        @rerun-test-run="onTestRunStart" />
      <FrogNotificationBar v-if="!!copiedConfig" class="copy-success-banner" type="neutral" :show="!!copiedConfig"
        customIcon="alert-success" full-width with-icon center-icon no-content-margin>
        <VuetifyBannerContent :is-toast="false" @close="copiedConfig = undefined">
          <p>
            Configuration copied successfully <RouterLink
              :to="{ name: ROUTE_NAMES.CONFIG_EDIT, params: { ...urlContext, id: copiedConfig } }">
              Jump to new
              configuration
            </RouterLink>
          </p>
        </VuetifyBannerContent>
      </FrogNotificationBar>
    </Teleport>
  </main>
</template>

<script setup lang="ts">
import { useConfirmDialog } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, onMounted, Ref, ref, watch, watchEffect } from 'vue'
import {
  onBeforeRouteLeave,
  type RouteLocationRaw,
  useRoute,
  useRouter,
} from 'vue-router'
import type { ApiError, GetRuns, SingleCheck } from '~/api'
import useVisualEditorNavigator from '~/composables/editor/useVisualEditorNavigator'
import useConfigFindings from '~/composables/useConfigFindings'
import { AddFileDuplicate } from '~/config/confirmDialogs'
import {
  MAIN_CONFIG_FILE,
  NEW_TEMPORARY_FILE,
  VARS_FILE,
} from '~/config/editor'
import {
  dumpConfiguration,
  loadConfiguration,
} from '~/helpers/configurationYaml'
import { findingsLabel } from '~/helpers/getFindingsCrossNavigationString'
import { ROUTE_NAMES } from '~/router'
import { useConfigStore } from '~/store/useConfigStore'
import { useRelationStore } from '~/store/useRelationStore'
import { useRunStore } from '~/store/useRunStore'
import useUserProfileStore from '~/store/useUserProfileStore'
import type { Config } from '~/types'
import type { CodeJump, EditorType, SimpleFileItem } from '~/types/Editor'
import type { Env, OnyxConfiguration } from '~/types/OnyxConfiguration'
import { storeContext, useApiCore, useApiNetworkError } from '~api'
import {
  deserializeJump,
  useDebugMode,
  useEditorFiles,
  useFileNotifBar,
  useMainHeading,
  useTestRun,
  useUrlContext,
  useYakuBrowseHistory,
} from '~composables'
import {
  getCheckFrom,
  getFilenameFromApiUrl,
  getFileUrls,
  incrementBasenameUntilAvailable,
  provideRequestError,
  ReplaceableVars,
  replaceAllVariables,
} from '~helpers'
import { getFileObject, splitNameAndExt } from '~utils'

const router = useRouter()
const { urlContext } = useUrlContext()
const route = useRoute()
const apiCore = useApiCore()
const apiError = ref<string>()
const { setHeading } = useMainHeading()
useDebugMode({ errorState: apiError })
const userProfileStore = useUserProfileStore()
const profile = storeToRefs(userProfileStore)
const editorType = computed<EditorType | undefined>(() => {
  const v = route.query.editor ?? profile.userProfile.value.editor
  if (v === 'visual' || v === 'code') {
    return v
  } else if (v === undefined) {
    return 'code'
  } else {
    return undefined
  }
})
watchEffect(() => {
  if (route.name !== 'EditConfig') return
  const heading =
    editorType.value === 'visual' ? 'Visual Editor' : 'Code Editor'
  setHeading(heading)
})

const search = ref('')

const {
  files,
  newFile,
  hasChanges,
  isLoaded,
  squashEdits,
  clearEdits,
  getFileById,
  setFile,
  setFileContent,
  updateFile,
  dirtyUpdate,
  fileItems,
  filesWithError,
  newFileItem,
  onFileCopy,
  onFileRename,
  selectedFile,
  onFileDelete,
} = useEditorFiles({ init: true })

const DEFAULT_EXIT_ROUTE = {
  name: ROUTE_NAMES.CONFIGS_OVERVIEW,
} satisfies RouteLocationRaw
/** register the next navigation in order to use it in the save functions after the user made a choise in the exit dialog */
const showExitDialog = ref<RouteLocationRaw | undefined>()
onBeforeRouteLeave(async (to) => {
  // hand over the navigation to the close dialog with the provided exit route
  if (hasChanges.value) {
    showExitDialog.value = to
  }
  return !hasChanges.value
})

// TODO: fix this type issue: it can be null
const configIdParam = computed(() => Number(route.params.id))
/** register the configuration to the user browsing history */
onMounted(() => {
  useYakuBrowseHistory().push({ configId: configIdParam.value })
})

const config = ref<Config & { description: string }>({
  id: configIdParam.value,
  name: '',
  description: '',
  creationTime: '',
  lastModificationTime: '',
  files: {},
})
const configFile = computed(() =>
  files.value.find((f) => f.filename === MAIN_CONFIG_FILE),
)
const configContent: Ref<string> = computed(
  () => configFile.value?.content || '',
)

const qgConfig: Ref<OnyxConfiguration> = computed({
  get() {
    return loadConfiguration(configContent.value)
  },
  set(content: OnyxConfiguration) {
    const id = configFile.value?.id
    if (id === undefined) return
    updateFile(id, {
      content: dumpConfiguration(content),
    })
  },
})

const configVersion = computed(() => {
  if (!qgConfig.value) return undefined
  if (!qgConfig.value.metadata) return 'v0'
  if (qgConfig.value.metadata.version.includes('v1')) return 'v1'
  return undefined
})

const varsOfFile = computed<Env>(() => {
  const file = files.value.find((f) => f.filename === VARS_FILE)
  return file?.content ? JSON.parse(file.content) : {}
})

const testRun = useTestRun()

const varsToReplace = computed<ReplaceableVars>(() => {
  const vars: Env = {
    ...(qgConfig.value?.default?.vars ?? {}),
    ...varsOfFile.value,
  }
  return {
    vars,
    env: qgConfig.value?.env ?? ({} as Env),
  }
})

const relationStore = useRelationStore()
const runStore = useRunStore(storeContext)
const { findingsAmount, getFindingsCount } = useConfigFindings()

watchEffect(async () => {
  if (!config.value) return

  const configId = config.value.id.toString()
  let runId: string | null = null

  try {
    // fetch the related run
    const runs = await apiCore.getLastRunOfConfigs({
      filter: { configIds: [Number(configId)] },
    })
    if (!runs.ok) return // stop initialization on request failure
    const { data } = (await runs.json()) as GetRuns
    const run = data.at(0)
    if (run) {
      if (runStore && typeof runStore.push === 'function') runStore.push([run])
      runId = run.id.toString()
    }

    // fetch findings only if there is a run
    if (runId) {
      await getFindingsCount(configId, true)
    }
  } catch (e) {
    console.error(e)
  }

  relationStore.setSmartRelation({
    configuration: {
      name: config.value.name,
      id: configId,
    },
    run: {
      id: runId,
    },
    findings: {
      label: findingsLabel(findingsAmount.value),
    },
  })
})

const onTestRunStart = (singleCheck: SingleCheck) => {
  if (!qgConfig.value) return

  const { chapter, requirement, check } = singleCheck
  const configCheck = getCheckFrom(qgConfig.value, {
    chapterId: chapter,
    requirementId: requirement,
    checkId: check,
  })
  const name = replaceAllVariables(configCheck.title, varsToReplace.value)
  testRun.start(configIdParam.value, { name }, singleCheck)
}

const disableExecuteWithHint = ref<string>()

const setEditorConfig = async (configId: number) => {
  try {
    const r = await apiCore.getConfig({ configId })
    if (r.status === 404) {
      router.push({ name: 'NotFoundError', params: urlContext.value })
    }
    if (!r.ok) {
      apiError.value = await provideRequestError(r)
      return
    }
    const c = (await r.json()) as Config
    config.value = {
      ...c,
      description: c.description ?? '',
    }
    // populate the content of the files
    const fileFetching = getFileUrls(config.value).map(async (url) => {
      const filename = getFilenameFromApiUrl(url)
      const file = setFile({ filename }) // register the file in the composable
      const content = await apiCore.getFileContent({ url }) // catch error in the upper function
      setFileContent({
        id: file.id,
        content,
      })
    })
    await Promise.allSettled(fileFetching)
    isLoaded.value = true
  } catch (e) {
    apiError.value = useApiNetworkError()
  }
}
watch(
  configIdParam,
  (newVal) => {
    if (router.currentRoute.value.name !== 'EditConfig') return
    if (newVal) setEditorConfig(newVal)
  },
  { immediate: true },
)

const addDuplicateFileDialog = useConfirmDialog()
const duplicateFilename = ref<{ old: string; new: string }>()
const onFileAdd = async (addedFiles: SimpleFileItem[]) => {
  editorState.value = 'adding'
  for (const file of addedFiles) {
    const isFileExisting = files.value.find((f) => f.filename === file.filename)
    // normalize the filename if the name is currently taken
    // and ask the user to confirm it or abort
    if (isFileExisting) {
      const newName = incrementBasenameUntilAvailable(
        file.filename,
        files.value.map((f) => splitNameAndExt(f.filename)),
      )
      duplicateFilename.value = { old: file.filename, new: newName }
      const { isCanceled } = await addDuplicateFileDialog.reveal()
      if (isCanceled) {
        editorState.value = 'ready'
        return
      }
      file.filename = newName
      duplicateFilename.value = undefined
    }
    const { filename } = file
    // bypass the edit as the file is uploaded directly
    // TODO: what happens if there are multiple failures ?
    try {
      const r = await apiCore.postFileInConfig({
        configId: configIdParam.value,
        content: getFileObject(file),
        filename,
      })
      if (!r?.ok) {
        apiError.value = await provideRequestError(r)
        return
      }
      if (file) {
        setFile({
          filename: file.filename,
          content: file.text,
        })
      }
    } catch {
      apiError.value = await provideRequestError()
      return
    } finally {
      editorState.value = 'ready'
      isLoaded.value = true
    }
  }
  // focus the first new file
  router.push({ query: { filename: addedFiles[0].filename, editor: 'code' } }) // somwhow route.query does not work
  editorState.value = 'ready'
  isLoaded.value = true
}

const onCreateFile = () => {
  newFile.value = NEW_TEMPORARY_FILE
}

const jump = ref<CodeJump | undefined>()
watch(
  route,
  (newRoute) => {
    const { content } = newRoute.query
    if (!content) return
    const jumpSerialized = content.toString()
    const jumpCandidate = deserializeJump(jumpSerialized)
    if (jumpCandidate) jump.value = jumpCandidate
  },
  { immediate: true },
)
/** clean the URL after the jump */
watch(jump, (newVal, oldVal) => {
  if (!newVal && oldVal) {
    router.replace({
      name: 'EditConfig',
      params: route.params,
      query: { editor: 'code' },
    })
  }
})
// ------------------------------
//  User Actions out of the page
// ------------------------------
type EditorState =
  | 'ready'
  | 'adding'
  | 'saving'
  | 'starting-run'
  | 'saveError'
  | 'saved'
const editorState = ref<EditorState>('ready')
/** clean the saved state to for ready after a defined timeout */
watch(editorState, (newVal) => {
  if (newVal !== 'saved') return
  clearEdits()
  setTimeout(() => (editorState.value = 'ready'), 3000)
})

const isFileError = ref(false)
const { notifBar } = useFileNotifBar({
  isSaved: computed(() => editorState.value === 'saved'),
  hasChanges,
  hasError: isFileError,
})

/** common logic to save before closing the editor _or_ executing a run */
type EditRequest = () => Promise<Response>
const onSave = async (configId: number) => {
  editorState.value = 'saving'
  const editRequests: EditRequest[] = squashEdits()
    .map((edit) => {
      if (edit.type === 'remove') {
        const { filename } = edit
        return () => apiCore.deleteFileInConfig({ configId, filename })
      } else {
        const file = getFileById(edit.id)
        if (!file) return
        const { filename } = file
        const content = getFileObject(file)
        const apiRequest =
          edit.type === 'add'
            ? apiCore.postFileInConfig
            : apiCore.patchFileInConfig
        return () => apiRequest({ configId, content, filename })
      }
    })
    .filter((x): x is EditRequest => !!x)
  const editResults = await Promise.allSettled(editRequests.map((r) => r()))
  const errors = editResults.filter(
    (x): x is PromiseFulfilledResult<Response> =>
      x.status === 'fulfilled' && !x.value.ok,
  )
  if (errors.length === 0) {
    editorState.value = 'saved'
  } else {
    // TODO: what to do on multiple errors. At the moment, only the first one is displayed
    apiError.value = await provideRequestError(errors[0].value)
    editorState.value = 'saveError'
  }
  if (editorState.value === 'saved') {
    clearEdits()
  }
  return editorState.value
}

const saveAndClose = async (
  configId: number,
  opts: { to: RouteLocationRaw },
) => {
  await onSave(configId)
  if (editorState.value === 'ready' || editorState.value === 'saved') {
    router.push(opts.to)
  }
}

const onSaveAndExecute = async (configId: number) => {
  await onSave(configId)
  if (editorState.value === 'saveError') return // TODO: on save error

  editorState.value = 'starting-run'
  try {
    const r = await apiCore.postRun({ configId })
    if (r.ok) {
      router.push({ name: ROUTE_NAMES.RUNS_OVERVIEW, params: urlContext.value })
    } else {
      apiError.value = await provideRequestError(r)
    }
  } catch (e) {
    apiError.value = useApiNetworkError()
  }
  editorState.value = 'ready'
}

/** clear the changes and navigate */
const onAbort = (to: RouteLocationRaw) => {
  clearEdits()
  router.push(to)
}
/** hook when the user wants to leave the view */
const onClose = (configId: number) => {
  if (hasChanges.value) {
    showExitDialog.value = DEFAULT_EXIT_ROUTE
  } else {
    saveAndClose(configId, { to: DEFAULT_EXIT_ROUTE }) // bypass dialog if there is no changes
  }
}

const configToDelete = ref<Config | null>(null)
const onConfigDelete = async () => {
  const configId = configToDelete.value?.id
  if (configId === undefined) return
  try {
    const r = await apiCore.deleteConfig({ configId })
    if (!r.ok) {
      apiError.value = ((await r.json()) as ApiError).message
    } else {
      useConfigStore(storeContext).removeById(configId)
      router.push({ name: ROUTE_NAMES.CONFIGS_OVERVIEW })
    }
  } catch (e) {
    apiError.value = useApiNetworkError()
  } finally {
    configToDelete.value = null
  }
}
const { currentContent, contentNavItems } = useVisualEditorNavigator(
  qgConfig,
  varsToReplace.value,
)

const configToCopy = ref<number>()
const copiedConfig = ref<number>()
const onFinishCopying = (id?: number) => {
  configToCopy.value = undefined
  if (id) {
    copiedConfig.value = id
  }
}
watch(configIdParam, () => {
  if (copiedConfig.value) {
    copiedConfig.value = undefined
  }
})
</script>

<style scoped lang="scss">
@use '../../styles/mixins/success-banner.scss' as SuccessBanner;

.editor-layout {
  display: flex;
  flex-direction: column;
  padding: $viewPadding $viewPadding !important;
  row-gap: $space-section;

  --bg-color-secondary: #F5F5F5; // grey-lighten-4
  background-color: var(--bg-color-secondary);
  color: #000000;

  .-dark-mode & {
    --bg-color-secondary: #212121; // grey-darken-4
    background-color: var(--bg-color-secondary);
    color: #FFFFFF;
  }

  &>*:not(.header)>:deep(*) {
    background-color: rgb(var(--v-theme-background));
  }

  .header {
    // adjust the color on the secondary background-color
    --minor-accent__enabled__front__default: #2196F3; // blue
  }

  .code-editor,
  .visual-editor {
    flex: 1 1 auto;
    height: calc(100% - $viewPadding - 64px); // - toolbar width
  }
}


.-dark-mode .editor-layout {
  background-color: black;

  --minor-accent__enabled__front__default: #2196F3; // blue

  &.--visual {
    --plain__enabled__front__default: #FAFAFA; // grey-lighten-5
    --integrated__enabled__front__default: #FAFAFA; // grey-lighten-5
  }
}

.copy-success-banner {
  padding: 20px;
  position: fixed;
  bottom: 0;
  @include SuccessBanner.bottom-success-banner;
}
</style>
