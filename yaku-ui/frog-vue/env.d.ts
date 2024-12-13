// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

/// <reference types="vite/client" />
/// <reference types="@histoire/plugin-vue/components" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, object, any>
  export default component
}
