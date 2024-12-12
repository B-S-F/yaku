// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { useBreakpoints } from '~/composables/useBreakPoints'

const breakpoints = useBreakpoints()

export const REPORT_ONBOARDING = [
  {
    selector: 'runs-overview',
    heading: 'Runs',
    description:
      'Once configured, Yaku handles execution and documentation, ensuring thorough checks are performed. Your configuration is packaged and executed, with the results displayed here',
    imagePath: '/assets/runs-overview.png',
    arrowPlacement: '-without-arrow-bottom' as const,
  },
  {
    selector: 'location',
    heading: 'Location of runs',
    description: 'Click on this icon to access the run overview',
    arrowPlacement: '-left-top' as const,
  },
  {
    selector: 'run-item',
    heading: 'Run',
    description:
      "Each run has checks that produce results, which are indicated here. Now, let's dive into the details to learn more about the outcome of the run",
    arrowPlacement: '-top-center' as const,
    linkToNext: 'lastRun',
  },
  {
    selector: 'run-overview',
    heading: 'Run Results',
    description:
      'The run result page provides an overview of all checks, along with their results and findings',
    imagePath: '/assets/run-result-overview.png',
    arrowPlacement: '-without-arrow-bottom' as const,
    linkToPrev: 'runs-overview',
  },
  {
    selector: 'run-chart',
    heading: 'Chart',
    description:
      'This diagram displays the results of all checks and the amount of manual responses. All elements can be used to filter the content of the page according to your needs',
    get arrowPlacement() {
      return breakpoints.value.from1500 ? '-left-center' : '-top-center'
    },
  },
  {
    selector: 'navigate-between-chapters',
    heading: 'Navigating between chapters',
    description:
      'Use this quick navigation to quickly switch between chapters. The indicators will show you where findings or failed checks have occurred',
    arrowPlacement: '-left-center' as const,
  },
  {
    selector: 'checks-result',
    heading: 'Check results',
    description:
      'Here you can see a list of all checks from the run along with their statuses. Findings are generated for each failed check. You can use tools like the AI explanation or navigate to the findings for further details',
    get arrowPlacement() {
      return breakpoints.value.from1500 ? '-right-center' : '-bottom-center'
    },
    maxWidth: '500px',
  },
]
