// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { defineConfig } from 'histoire'
import { HstVue } from '@histoire/plugin-vue'

export default defineConfig({
  plugins: [HstVue()],
  setupFile: 'histoire-setup.ts',
  tree: {
    file: ({ path, title }) => [
      ...path.split('/').slice(1, 2),
      title
        .replace(/([A-Z])/g, ' $1')
        // uppercase the first character
        .replace(/^./, (str) => str.toUpperCase()),
    ],
  },
})
