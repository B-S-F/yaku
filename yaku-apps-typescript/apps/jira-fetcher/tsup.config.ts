import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/**/*.ts'],
  splitting: false,
  sourcemap: true,
  clean: true,
  target: 'node18',
  format: ['esm'],
  bundle: false,
})
