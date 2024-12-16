// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TEST_RUN_FEATURE: string | undefined
  readonly VITE_TEST_RELEASE_PLANNING_FEATURE: string | undefined
  readonly VITE_TEST_RELEASE_EMAILS: string | undefined
  readonly VITE_TEST_TASK_MANAGEMENT: string | undefined
  readonly VITE_TEST_VUETIFY_UI: string | undefined
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { Component } from 'vue'
  const component: Component
  export default component
}

declare module 'smartquotes' {
  function smartquotes(
    context: string | Node | Document | HTMLElement | null,
  ): string
  export default smartquotes
}
