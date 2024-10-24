import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/**/*.ts', 'lib/**/*.ts'],
  splitting: false,
  clean: true,
  target: 'node18',
  format: ['esm'],
  bundle: false,
  sourcemap: true,
})
