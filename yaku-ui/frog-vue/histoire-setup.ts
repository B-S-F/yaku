// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { defineSetupVue3 } from '@histoire/plugin-vue'
import type { App } from 'vue'
import { components } from './src/components'
import setupVuetify from './src/vuetify-setup'

export const setupVue3 = defineSetupVue3(({ app }) => {
  // Vue plugins
  app.use(setupVuetify)
  app.use({
    install: (app: App) => {
      Object.entries(components).forEach(([name, component]) => {
        // remove the Frok prefix
        app.component(name.slice(3), component)
      })
    },
  })
})
