/**
 * Copyright (c) 2022, 2023 by grow platform GmbH
 */

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    testTimeout: 15000,
    include: ['test/integration/**/*.int-spec.ts'],
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 1,
        minThreads: 1,
      },
    },
    typecheck: {
      tsconfig: 'tsconfig.json',
    },
    reporters: ['junit', 'default'],
    outputFile: 'reports/integration-test-results.xml',
  },
})
