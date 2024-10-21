/**
 * Copyright (c) 2022, 2023 by grow platform GmbH
 */
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    typecheck: {
      tsconfig: 'tsconfig.json',
    },
    coverage: {
      provider: 'v8',
      all: true,
      enabled: true,
      reporter: ['cobertura', 'json-summary', 'text-summary'],
      include: ['src'],
      exclude: ['src/index.ts', 'src/types.ts'],
    },
    reporters: ['junit', 'default'],
    outputFile: 'reports/test-results.xml',
  },
})
