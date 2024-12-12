// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { ref } from 'vue'

const isActive = ref(false)

export const useIsOnboardingActive = () => {
  return {
    isActive,
  }
}
