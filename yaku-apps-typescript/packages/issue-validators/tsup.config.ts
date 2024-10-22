/**
 * Copyright (c) 2022, 2023 by grow platform GmbH
 */

import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/**/*.ts'],
  splitting: false,
  clean: true,
  target: 'node18',
  format: ['esm'],
  bundle: false,
  sourcemap: true,
})
