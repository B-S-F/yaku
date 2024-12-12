// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { ROUTE_NAMES } from '~/router'
import { OnboardingTour } from '~/types'
import { REPORT_ONBOARDING } from './config/Report'
import { DASHBOARD_ONBOARDING } from './config/Dashboard'
import { RELEASE_ONBOARDING } from './config/Release'

type OnboardingRoute = {
  name: string
  config: OnboardingTour
}

export const useOnboardingRoutes = (): OnboardingRoute[] => {
  return [
    { name: ROUTE_NAMES.RUNS_OVERVIEW, config: REPORT_ONBOARDING },
    { name: ROUTE_NAMES.DASHBOARD, config: DASHBOARD_ONBOARDING },
    { name: ROUTE_NAMES.RELEASE_OVERVIEW, config: RELEASE_ONBOARDING },
  ]
}
