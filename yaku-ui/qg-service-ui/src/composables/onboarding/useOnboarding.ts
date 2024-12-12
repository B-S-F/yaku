// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { ref } from 'vue'
import type { OnboardingTour } from '~/types'
import { useIsOnboardingActive } from './useIsOnboardingActive'

export const onboardingTour = ref<OnboardingTour>()

type UseOnboardingOpts = {
  onboardingTour: OnboardingTour
}
export const useOnboarding = (options: UseOnboardingOpts) => {
  const { isActive } = useIsOnboardingActive()
  onboardingTour.value = options.onboardingTour

  return {
    start: () => {
      isActive.value = true
    },
  }
}
