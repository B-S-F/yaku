import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: [
      'integration-test/mocktests/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    reporters: ['junit', 'default'],
    outputFile: 'results/integration-test-results.xml',
    maxConcurrency: 1,
    maxThreads: 1,
    minThreads: 1,
  },
})
