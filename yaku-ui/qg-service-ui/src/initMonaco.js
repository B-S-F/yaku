// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import EditorWorkerService from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import JsonWorkerService from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import YamlWorker from '~/composables/editor/yaml.worker?worker'

self.MonacoEnvironment = {
  globalAPI: true,
  getWorker(moduleId, label) {
    switch (label) {
      case 'editorWorkerService':
        return new EditorWorkerService()
      case 'yaml':
        return new YamlWorker()
      case 'json':
        return new JsonWorkerService()
      default:
        throw new Error(`Unknown label ${label}`)
    }
  },
}
