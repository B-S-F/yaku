// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { App } from 'vue'
import { components } from './components'
import { directives } from './directives'
import vuetifySetup from './vuetify-setup'

export const installFrokComponents = {
  install: (app: App) => {
    Object.entries(components).forEach(([name, component]) => {
      app.component(name, component)
    })
  },
}

export const installFrokDirectives = {
  install: (app: App) => {
    directives.forEach(([name, directive]) => {
      app.directive(name, directive)
    })
  },
}

export const installVuetify = {
  install: (app: App) => {
    app.use(vuetifySetup)
  },
}
