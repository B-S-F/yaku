// SPDX-FileCopyrightText: 2022 2023 by grow platform GmbH
// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
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
