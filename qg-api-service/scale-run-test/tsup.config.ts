// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/**/*.ts'],
  splitting: false,
  clean: true,
  target: 'node22',
  format: ['esm'],
  bundle: false,
  sourcemap: true,
})
