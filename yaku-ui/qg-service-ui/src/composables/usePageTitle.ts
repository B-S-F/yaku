// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { useTitle } from '@vueuse/core'
import { computed } from 'vue'
import { useMainHeading } from './useMainHeading'
import { FULL_APP_NAME } from '~/config/app'

export const usePageTitle = () => {
  const pageTitle = computed(() => {
    const { heading } = useMainHeading()
    return heading.value ? `${heading.value} | ${FULL_APP_NAME}` : FULL_APP_NAME
  })

  useTitle(pageTitle)
}
