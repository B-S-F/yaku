// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import {
  installFrokComponents,
  installFrokDirectives,
  installVuetify,
} from './plugins'

export * from './composables'
export * from './types'

// @ts-expect-error NOTE: vuetify styles do exist
export const addVuetifyStyles = () => import('vuetify/styles')

export const addMdiIcons = () => import('@mdi/font/css/materialdesignicons.css')

export {
  // Plugins
  installFrokComponents,
  installFrokDirectives,
  installVuetify,
}
