// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { useBreakpoints } from '~/composables/useBreakPoints'
const breakpoints = useBreakpoints()

export const RELEASE_ONBOARDING = [
  {
    selector: 'releases',
    heading: 'Releases',
    description: 'Here you can find an overview about all planned releases',
    imagePath: '/assets/releases-overview.png',
    arrowPlacement: '-without-arrow-top' as const,
  },
  {
    selector: 'location',
    heading: 'Location of releases',
    description: 'Click on this icon to access the release overview',
    arrowPlacement: '-left-top' as const,
  },
  {
    selector: 'release-toolbar',
    heading: 'Toolbar',
    description:
      'Here you can create a new release or search for an already created release',
    arrowPlacement: '-top-center' as const,
  },
  {
    selector: 'release-item',
    heading: 'Release - list items',
    description:
      "The list provides a general overview of a release. Let's take a closer look at this release and move forward to the details",
    arrowPlacement: '-top-center' as const,
    linkToNext: 'lastRelease',
  },
  {
    selector: 'release-details-toolbar',
    heading: 'Toolbar',
    description:
      'Here you will find tools and information regarding this release, e.g. its approval state or the report',
    arrowPlacement: '-top-center' as const,
    linkToPrev: 'releases-overview',
  },
  {
    selector: 'quick-navigation',
    heading: 'Quick navigation',
    description: 'Quickly access the results and findings of each check',
    arrowPlacement: '-left-center' as const,
  },
  {
    selector: 'check-results',
    heading: 'Check results',
    description:
      'This section provides all checks with additional details, including any generated findings, and features a navigation tool for easily moving from one check to the next',
    get arrowPlacement() {
      return breakpoints.value.from1500 ? '-left-center' : '-top-center'
    },
    maxWidth: '500px',
  },
  {
    selector: 'comments',
    heading: 'Comments',
    description:
      'This section offers a dedicated space for discussions specific to each check',
    get arrowPlacement() {
      return breakpoints.value.from1500 ? '-right-center' : '-bottom-center'
    },
    linkToNext: 'history',
  },
  {
    selector: 'history',
    heading: 'History',
    description:
      'Here you can find a summary of all communication that took place in regards to the release. Use the pills to filter the content according to your needs',
    arrowPlacement: '-without-arrow-top' as const,
    linkToPrev: 'lastRelease',
  },
]
