// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { PiniaSharedState } from 'pinia-shared-state'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
pinia.use(
  PiniaSharedState({
    // enables the plugin for all stores. Defaults to true.
    // Set the false as it erases serializer custom option for the workbook store
    // TODO: needs to be enabled to make stores work
    enable: true,
    // tries to immediately recover the shared state from another tab. Defaults to true.
    initialize: true,
  }),
)

export { pinia }
