// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { ArrowPlacement } from '@B-S-F/frog-vue'

export type OnboardingTour = OnboardingStep[]

export type OnboardingStep = {
  selector: string
  heading: string
  description: string
  imagePath?: string
  arrowPlacement: ArrowPlacement
  linkToNext?: string
  linkToPrev?: string
  maxWidth?: string
}
