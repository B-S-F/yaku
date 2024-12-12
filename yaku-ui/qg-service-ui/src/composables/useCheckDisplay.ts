// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { MaybeRef, reactiveComputed } from '@vueuse/core'
import { unref } from 'vue'
import type { RunResultStatus } from '~/types/RunReport'
import { useColorScheme } from './useColorScheme'

export const CHECK_DISPLAY_CONFIG: Record<
  RunResultStatus,
  StatusDisplayConfig
> = {
  GREEN: {
    icon:
      import.meta.env.VITE_TEST_VUETIFY_UI === 'true'
        ? 'mdi-check-circle-outline'
        : 'alert-success',
    label: 'Check passed',
    theme: {
      light: {
        bgColor: '#b8efc9',
        color: '#00884a',
      },
      dark: {
        bgColor: '#00884a',
        color: '#37a264',
      },
    },
  },
  RED: {
    icon:
      import.meta.env.VITE_TEST_VUETIFY_UI === 'true'
        ? 'mdi-alert-circle-outline'
        : 'problem-frame',
    label: 'Check did not pass',
    theme: {
      light: {
        bgColor: '#ffd9d9',
        color: '#920002',
      },
      dark: {
        bgColor: '#680001',
        color: '#a80003',
      },
    },
  },
  YELLOW: {
    icon:
      import.meta.env.VITE_TEST_VUETIFY_UI === 'true'
        ? 'mdi-alert-outline'
        : 'alert-warning',
    label: 'Check passed with warnings',
    theme: {
      light: {
        bgColor: '#ffdf95',
        color: '#ffcf00',
      },
      dark: {
        bgColor: '#725b00',
        color: '#ad8c00',
      },
    },
  },
  PENDING: {
    icon:
      import.meta.env.VITE_TEST_VUETIFY_UI === 'true'
        ? 'mdi-clock-time-three-outline'
        : 'clock-pause',
    label: 'PENDING: No check configured',
    theme: {
      light: {
        bgColor: 'var(--v-theme-background)',
        color: '#71767c',
      },
      dark: {
        bgColor: '#43464a',
        color: '#8a9097',
      },
    },
  },
  UNANSWERED: {
    icon:
      import.meta.env.VITE_TEST_VUETIFY_UI === 'true'
        ? 'mdi-help-circle-outline'
        : 'question-frame',
    label: 'Unanswered',
    theme: {
      light: {
        bgColor: 'var(--v-theme-background)',
        color: '#71767c',
      },
      dark: {
        bgColor: '#43464a',
        color: '#8a9097',
      },
    },
  },
  NA: {
    icon:
      import.meta.env.VITE_TEST_VUETIFY_UI === 'true' ? 'mdi-cancel' : 'denied',
    label: 'Check not applicable',
    theme: {
      light: {
        bgColor: '#9dc9ff',
        color: '#007bc0',
      },
      dark: {
        bgColor: '#00629a',
        color: '#007bc0',
      },
    },
  },
  FAILED: {
    icon:
      import.meta.env.VITE_TEST_VUETIFY_UI === 'true'
        ? 'mdi-alert-octagon'
        : 'alert-error',
    label: 'Auto-pilot failed with runtime error',
    theme: {
      light: {
        bgColor: '#ffc6c6',
        color: '#ed0007',
      },
      dark: {
        bgColor: '#680001',
        color: '#ed0007',
      },
    },
  },
  ERROR: {
    icon:
      import.meta.env.VITE_TEST_VUETIFY_UI === 'true'
        ? 'mdi-bug-outline'
        : 'bug',
    label: 'Autopilot configuration error',
    theme: {
      light: {
        bgColor: '#ffc6c6',
        color: '#540001',
      },
      dark: {
        bgColor: '#680001',
        color: '#ff5152',
      },
    },
  },
  SKIPPED: {
    icon:
      import.meta.env.VITE_TEST_VUETIFY_UI === 'true'
        ? 'mdi-help-circle-outline'
        : 'question-frame',
    label: 'Skipped',
    theme: {
      light: {
        bgColor: '#1a1c1d',
        color: '#ffffff', // FIXME: var(--neutral__enabled__front__default
      },
      dark: {
        bgColor: '#1a1c1d',
        color: '#ffffff',
      },
    },
  },
}

type ThemableProperties = 'bgColor' | 'color'
type Theme = Pick<StatusDisplay, ThemableProperties>
type StatusDisplayConfig = Omit<StatusDisplay, ThemableProperties> & {
  theme: { light: Theme; dark: Theme }
}

const { colorScheme } = useColorScheme()

export type StatusDisplay = {
  bgColor: string
  color: string
  icon: string
  label: string
}
export const useCheckDisplay = (
  status: MaybeRef<RunResultStatus>,
): StatusDisplay => {
  const display = reactiveComputed(() => {
    const s = unref(status)
    return {
      ...CHECK_DISPLAY_CONFIG[s],
      ...CHECK_DISPLAY_CONFIG[s]['theme'][colorScheme.value ?? 'light'],
    }
  })

  return display
}
