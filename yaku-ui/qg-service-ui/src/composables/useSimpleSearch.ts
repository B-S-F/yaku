// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { MaybeRef } from '@vueuse/shared'
import { computed, unref } from 'vue'

export type UseSimpleSearchParams<T> = {
  search: MaybeRef<string>
  candidates: MaybeRef<Readonly<T[]>>
  searchIn: Array<keyof T>
}
export const useSimpleSearch = <T>(params: UseSimpleSearchParams<T>) => {
  const { search, candidates, searchIn } = params

  const sanitizeSearch = (s: string) => s?.trim().toLocaleLowerCase() ?? ''

  const results = computed(() => {
    const sanitizedSearch = sanitizeSearch(unref(search))

    return unref(candidates).filter((item) =>
      searchIn.some((k) =>
        sanitizeSearch(item[k] as string).includes(sanitizedSearch),
      ),
    )
  })

  return {
    results,
  }
}
