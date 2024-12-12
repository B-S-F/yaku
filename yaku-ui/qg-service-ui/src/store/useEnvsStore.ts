// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { RawEnvironment, UIConfig } from '~/types'

const fetchEnvironments = () =>
  fetch('/ui-config.json').then(async (r) => (await r.json()) as UIConfig)
const ENVS_STORE_KEY = 'ui-envs'
export const envsStore = () => {
  // refs
  const environments = ref<RawEnvironment[]>([])
  const fallbackEnvironment = ref<string>('production')

  // actions
  const getEnvironments = async () => {
    const config = await fetchEnvironments()
    environments.value = config.environments
    return config.environments
  }

  const findEnvBySlug = (slug: string) =>
    environments.value.find((env) => env.slug === slug)

  const updateEnvInEnvs = (slug: string, payload: Partial<RawEnvironment>) => {
    const env = environments.value.findIndex((env) => env.slug === slug)
    if (env === -1) return
    environments.value[env] = {
      ...environments.value[env],
      ...payload,
    }
    return environments.value[env]
  }
  // fetch namespaces...\
  return {
    environments,
    findEnvBySlug,
    getEnvironments,
    updateEnvInEnvs,
    fallbackEnvironment,
  }
}

export default () =>
  defineStore(ENVS_STORE_KEY, envsStore, {
    persist: {
      storage: sessionStorage,
    },
  })()
