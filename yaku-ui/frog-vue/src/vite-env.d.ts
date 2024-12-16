// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

/// <reference types="vite/client" />
import type { FrokComponents } from 'src'

declare module '@vue/runtime-core' {
  export interface GlobalComponents extends FrokComponents {}
}
