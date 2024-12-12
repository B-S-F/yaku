// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { useBreakpoints } from '~/composables/useBreakPoints'

const breakpoints = useBreakpoints()

export const DASHBOARD_ONBOARDING = [
  {
    selector: 'restart-onboarding',
    heading: 'Want to start again?',
    description: 'If you want to redo any tour, you can access it right here',
    arrowPlacement: '-left-center' as const,
  },
  {
    selector: 'dashboard',
    heading: 'Dashboard',
    description:
      'Check your performance at a glance with the Yaku Dashboard. Learn how to use and configurate your personal dashboard in just a few minutes',
    imagePath: '/assets/dashboard-overview.png',
    arrowPlacement: '-without-arrow-top' as const,
  },
  {
    selector: 'location',
    heading: 'Location of dashboard',
    description: 'Click on this icon to access your dashboard at any time',
    arrowPlacement: '-left-top' as const,
  },
  {
    selector: 'performance',
    heading: 'Performance',
    description:
      'You can visualize the performance of a specific configuration over a certain period of time on this chart. Simply use the dropdown menus to modify the parameters and hover over a data point in the graph to obtain extra details',
    arrowPlacement: '-top-center' as const,
  },
  {
    selector: 'last-opened-tile',
    heading: 'Last opened',
    description:
      'Here are your most recent open configurations, including the last successful run and its findings. You can conveniently access them using the provided links',
    get arrowPlacement() {
      return breakpoints.value.from1500 ? '-left-center' : '-bottom-center'
    },
  },
  {
    selector: 'most-findings',
    heading: 'Most Findings',
    description:
      'The configurations that generated the highest number of findings are displayed here. As there may be additional actions needed to reduce the number of findings, the links can also serve as shortcuts for quick access',
    get arrowPlacement() {
      return breakpoints.value.from1500 ? '-right-center' : '-bottom-center'
    },
  },
  {
    selector: 'most-decreased',
    heading: 'Decreased Quality',
    description:
      'A high number of findings can sometimes be perceived as a sign of decreased quality. Therefore, runs that have produced the most new findings are presented here',
    get arrowPlacement() {
      return breakpoints.value.from1500 ? '-left-center' : '-bottom-center'
    },
  },
  {
    selector: 'most-increased',
    heading: 'Increased Quality',
    description:
      'In contrast to the previous section, runs that have generated fewer findings compared to earlier instances are listed here',
    get arrowPlacement() {
      return breakpoints.value.from1500 ? '-right-center' : '-bottom-center'
    },
  },
]
