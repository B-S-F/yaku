// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export {}

declare module 'vue-router' {
  interface RouteMeta {
    heading?: string
    isErrorView?: boolean
    isExtraView?: boolean
    authRequired?: boolean
    isPrintView?: boolean
  }
}
