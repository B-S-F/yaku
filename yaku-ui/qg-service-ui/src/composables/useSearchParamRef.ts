// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { useUrlSearchParams } from '@vueuse/core'
import { ComputedRef, computed, isReactive, unref, watch } from 'vue'

type SearchParam = string | string[]

type UseUrlSearchParamRefParams<T> = {
  key: string
  initialValue?: T | ComputedRef<T | undefined>
  serializer: (v: T | string | undefined) => SearchParam | undefined
  deserializer: (v: SearchParam | undefined) => T
}

/**
 * Reflect the ref to the url query parameters.
 * It uses serializer and deserializer to keep the property consistent in all places
 * where it is set or used.
 * It supports a simple value for now.
 */
export const useSearchParamRef = <T>(params: UseUrlSearchParamRefParams<T>) => {
  const { key, initialValue, serializer, deserializer } = params
  const urlSearchParams = useUrlSearchParams('hash')

  const value = computed({
    get() {
      return urlSearchParams[key] !== undefined
        ? deserializer(urlSearchParams[key])
        : undefined
    },
    set(v: Parameters<UseUrlSearchParamRefParams<T>['serializer']>[0]) {
      urlSearchParams[key] = serializer(v) ?? ''
    },
  })

  if (initialValue) {
    if (isReactive(initialValue)) {
      watch(initialValue, (iv) => {
        if (unref(iv) && value.value === undefined) {
          value.value = unref(iv)
        }
      })
    } else {
      if (initialValue && value.value === undefined) {
        value.value = unref(initialValue)
      }
    }
  }

  return {
    value,
  }
}
