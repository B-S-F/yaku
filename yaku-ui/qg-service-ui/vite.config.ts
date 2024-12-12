// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

/// <reference types="vitest" />
/// <reference types="vite" />
import type { NodeTransform } from '@vue/compiler-core'
import { resolve } from 'path'
import {
  PluginOption,
  defineConfig,
  searchForWorkspaceRoot,
  loadEnv,
} from 'vite'
import Components from 'unplugin-vue-components/vite'
import vue from '@vitejs/plugin-vue'
import istanbul from 'vite-plugin-istanbul'
import uiConfig from './ui-dev-config.json'

const UI_DEV_CONFIG = JSON.stringify(uiConfig)

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  /** Modify a vue node to remove potential data-cy attribute */
  const stripDataCy: NodeTransform = (node) => {
    if (node.type !== 1 /*NodeTypes.ELEMENT*/) return
    for (let i = 0; i < node.props.length; i++) {
      const p = node.props[i]
      if (p && p.type === 6 /*NodeTypes.ATTRIBUTE*/ && p.name === 'data-cy') {
        node.props.splice(i, 1)
        i--
      }
    }
  }

  const switchDevIndex: PluginOption = {
    name: 'switch-dev-index',
    /** while building */
    config(config, env) {
      if (env.mode === 'dev:mock') {
        config.build = {
          rollupOptions: {
            input: 'index.dev.html',
          },
        }
      }
    },
    /** while running a dev server */
    configureServer({ middlewares }) {
      middlewares.use(async (req, res, next) => {
        if (req.url === '/ui-config.json' && mode === 'dev') {
          res.write(UI_DEV_CONFIG)
          res.end()
          return // stops on the middleware level
        }
        if (req.url === '/') {
          req.url = '/index.dev.html'
        }
        next()
      })
    },
  }

  return {
    build: {
      sourcemap: mode === 'dev:mock' ? 'inline' : 'hidden',
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "/src/globals.scss" as *;`,
        },
      },
    },
    plugins: [
      Components({
        dirs: ['src/components', 'src/icons'],
      }),
      vue({
        script: {
          propsDestructure: true,
          defineModel: true,
        },
        template: {
          compilerOptions: {
            nodeTransforms: mode === 'production' ? [stripDataCy] : undefined,
          },
        },
      }),
      istanbul({
        include: 'src/*',
        exclude: ['node_modules', 'test/', 'public/'],
        extension: ['.js', '.ts', '.vue'],
        requireEnv: true, // needs VITE_COVERAGE to be true
        cypress: true, // use CYPRESS_COVERAGE instead of VITE_COVERAGE
        forceBuildInstrument: mode === 'dev:mock', // allow it for npm run build (meant for the ci workflow)
      }),
      switchDevIndex,
    ],
    resolve: {
      alias: {
        '~': resolve(__dirname, './src'),
        // utils
        '~composables': resolve(__dirname, './src/composables'),
        '~api': resolve(__dirname, './src/composables/api'),
        '~utils': resolve(__dirname, './src/utils'),
        '~helpers': resolve(__dirname, './src/helpers'),
      },
    },
    server: {
      port: mode === 'development' ? 5173 : (Number(process.env.PORT) ?? 3000),
      fs: {
        allow: (() => {
          const env = loadEnv(mode, process.cwd())
          const arr = []
          arr.push(searchForWorkspaceRoot(process.cwd()))

          if (typeof env.VITE_TEST_FROK_DIST === 'string') {
            arr.push(env.VITE_TEST_FROK_DIST)
          }

          if (typeof env.VITE_TEST_FROK_FONTS === 'string') {
            arr.push(env.VITE_TEST_FROK_FONTS)
          }

          return arr
        })(),
      },
    },
    optimizeDeps: {
      include: [
        'monaco-editor/esm/vs/editor/editor.worker',
        'monaco-editor/esm/vs/language/json/json.worker',
        'monaco-yaml/yaml.worker',
      ],
    },
    test: {
      // enable jest-like global test APIs
      globals: true,
      reporters: ['junit'],
      outputFile: 'reports/unit/results/results.xml',
      coverage: {
        provider: 'v8',
        reportsDirectory: 'reports/unit/coverage',
        include: ['src/composables/*', 'src/helpers/*', 'src/utils/*'],
        exclude: ['src/composables/api/*', 'src/composables/msal/*'],
      },
      // simulate DOM with happy-dom
      // (requires installing happy-dom as a peer dependency)
      environment: 'jsdom',
      setupFiles: [resolve(__dirname, 'vite.setup.ts')],
      server: {
        deps: {
          inline: ['vuetify'],
        },
      },
    },
  }
})
