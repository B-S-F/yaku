// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { readonly, ref } from 'vue'
import { useRouter } from 'vue-router'

const heading = ref('')
const initialized = ref(false)

export const useMainHeading = () => {
  const router = useRouter()
  const setHeading = (t: string) => (heading.value = t)

  if (!initialized.value) {
    const { heading } = router.currentRoute.value.meta
    if (heading) {
      setHeading(heading)
    }

    router.afterEach((to) => {
      const { heading } = to.meta
      if (heading) {
        setHeading(heading)
      }
    })

    initialized.value = true
  }

  return {
    heading: readonly(heading),
    setHeading,
  }
}
