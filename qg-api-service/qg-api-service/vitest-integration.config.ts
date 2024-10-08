import swc from 'rollup-plugin-swc'
import { VitePluginNode } from 'vite-plugin-node'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['integration-tests/**/*.int-spec.ts'],
    globalSetup: ['integration-tests/dbsetup.js'],
    maxConcurrency: 1,
    hookTimeout: 50000,
    testTimeout: 10000,
    /*
     * The embedded postgres dependency registers an async shutdown hook. This
     * hook causes vitest to hang at the end of execution until it runs into a
     * timeout and exits forcefully.
     *
     * Reduce the timeout to one second to reduce the impact.
     */
    teardownTimeout: 1000,
    maxThreads: 1,
    minThreads: 1,
    deps: {
      interopDefault: true,
    },
    typecheck: {
      tsconfig: 'tsconfig.json',
    },
    reporters: ['junit', 'default'],
    outputFile: 'results/integration-test-results.xml',
  },
  esbuild: false,
  plugins: [
    ...VitePluginNode({
      appPath: './src/main.ts',
      adapter: 'nest',
      tsCompiler: 'swc',
    }),
    swc({
      jsc: {
        parser: {
          syntax: 'typescript',
          dynamicImport: true,
          decorators: true,
        },
        target: 'es2021',
        transform: {
          decoratorMetadata: true,
        },
      },
    }),
  ],
})
