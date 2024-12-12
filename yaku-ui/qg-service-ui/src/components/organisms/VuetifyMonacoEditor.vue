<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div ref="editorNodeRef" class="monaco-editor" :style="style" data-cy="editor" />
</template>

<script setup lang="ts">
import type { EditorFileErrorUpdate } from '~/types'
import '~/initMonaco'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { editor, Uri } from 'monaco-editor'
import { usePasteEditorAction } from '~/composables/editor'

type MonacoEditorProps = {
  width: string | number
  height: string | number
  value: string
  filename: string
  language?: string
  theme?: string
  options?: Record<string, any>
}
const props = withDefaults(defineProps<MonacoEditorProps>(), {
  theme: 'vs',
  options: () => ({}),
})

const emit = defineEmits<{
  (e: 'change', newVal: string, event: editor.IModelContentChangedEvent): void
  (e: 'update:value', newVal: string): void
  (e: 'editorDidMount', editor: editor.IStandaloneCodeEditor): void
  (e: 'fileErrorAmount', newVal: EditorFileErrorUpdate): void
}>()

const editorNodeRef = ref<HTMLDivElement>()
let monaco: editor.IStandaloneCodeEditor | null = null

const currentModelUri = computed(() => Uri.parse(props.filename))
/** Thin wrapper that handles the model uri */
const createModel = (content: string, language?: string) =>
  editor.createModel(content, language, currentModelUri.value)
const getCurrentModel = () => editor.getModel(currentModelUri.value)

onMounted(() => {
  if (!editorNodeRef.value) return
  const model = getCurrentModel() ?? createModel(props.value, props.language)
  monaco = editor.create(editorNodeRef.value, {
    language: props.language,
    model,
    theme: props.theme,
    tabSize: 2,
  })

  monaco.onDidChangeModelContent((event) => {
    const value = monaco?.getValue() ?? ''
    if (value !== props.value) {
      emit('update:value', value)
      emit('change', value, event)
    }
  })

  editor.onDidChangeMarkers((uris) => {
    uris.forEach((uri) => {
      const markers = editor.getModelMarkers({ resource: uri })
      emit('fileErrorAmount', {
        filename: props.filename,
        value: markers.length,
      })
    })
  })

  usePasteEditorAction({ editor: monaco })

  emit('editorDidMount', monaco)
})

onBeforeUnmount(() => {
  getCurrentModel()?.dispose()
  monaco?.dispose()
})

/**
 * On prop value changes, update the editor content.
 * If the file changes, a new model is created instead in the currentModelUri watcher.
 */
watch(
  () => props.value,
  (newVal) => {
    if (!monaco) return
    const value = monaco.getValue()
    if (value !== newVal) {
      monaco.setValue(newVal)
    }
  },
)

/**
 * Set a new model in the editor on file change.
 * It allows language workers to work properly for each file.
 */
watch(currentModelUri, () => {
  if (!monaco || !props.filename) return
  const newModel = createModel(props.value, props.language)
  monaco.getModel()?.dispose()
  monaco.setModel(newModel)
})

watch(
  () => props.options,
  (newOpts) => {
    monaco?.updateOptions(newOpts)
  },
  { deep: true },
)

watch(
  () => props.theme,
  (newTheme) => {
    editor.setTheme(newTheme)
  },
)

/**
 * Update the language of the model on language changes
 */
watch(
  () => props.language,
  (newLanguage) => {
    const model = editor.getModel(currentModelUri.value)
    if (!model || !newLanguage) return
    editor.setModelLanguage(model, newLanguage)
  },
)

const style = computed(() => {
  const fixedWidth = props.width.toString().includes('%')
    ? props.width
    : `${props.width}px`
  const fixedHeight = props.height.toString().includes('%')
    ? props.height
    : `${props.height}px`
  return `width: ${fixedWidth}; height: ${fixedHeight}`
})
</script>

<style scoped lang="scss">
@use '../../styles/components/editor/monaco-suggest-widget.scss';
@use '../../styles/components/editor/config-editor.scss';
</style>
