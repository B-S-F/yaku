// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { type MaybeRef, reactiveComputed } from '@vueuse/shared'
import { markRaw, unref } from 'vue'
import { type RunIcon, VuetifyRunCompletedIcon } from '~/icons/runIcons'
import RunPendingIcon from '~/icons/runIcons/RunPendingIcon.vue'
import VuetifyRunFailedOutlineIcon from '~/icons/runIcons/VuetifyRunFailedOutlineIcon.vue'
import VuetifyRunRunningIcon from '~/icons/runIcons/VuetifyRunRunningIcon.vue'
import type { RunCompleted, RunState, RunUnaccomplished } from '~/types'
import { useColorScheme } from './useColorScheme'

type IconType =
  | { icon: string; iconComponent?: undefined }
  | { icon?: undefined; iconComponent: RunIcon }

type Theme = {
  bgColor: string
  color: string
}

type ThemeConfig = { light: Theme; dark: Theme }
export type RunDisplay = IconType & Theme
type RunDisplayConfig = IconType & { theme: ThemeConfig }

const VUETIFY_RUN_UNACCOMPLISHED_DISPLAY: Record<
  RunUnaccomplished['status'] | 'completed',
  RunDisplayConfig
> = {
  pending: {
    iconComponent: RunPendingIcon,
    theme: {
      light: {
        bgColor: '#F5F5F5', // grey-lighten-4 'var(--background)',
        color: '#BDBDBD', // grey-lighten-1 ,
      },
      dark: {
        bgColor: '#616161', // grey-darken-2 ,
        color: '#F5F5F5', // grey-lighten-4 ,
      },
    },
  },
  running: {
    iconComponent: VuetifyRunRunningIcon,
    theme: {
      light: {
        bgColor: '#F5F5F5', // grey-lighten-4 'var(--background)',
        color: '#1565C0', // blue-darken-3 ,
      },
      dark: {
        bgColor: '#616161', // grey-darken-2 ,
        color: '#1E88E5', // blue-darken-1 ,
      },
    },
  },
  completed: {
    iconComponent: VuetifyRunCompletedIcon,
    theme: {
      light: {
        bgColor: '#F5F5F5', // grey-lighten-4 'var(--background)',
        color: '#BDBDBD', // grey-lighten-1 ,
      },
      dark: {
        bgColor: '#616161', // grey-darken-2 ,
        color: '#F5F5F5', // grey-lighten-4 ,
      },
    },
  },
  failed: {
    iconComponent: VuetifyRunFailedOutlineIcon,
    theme: {
      light: {
        bgColor: '#FFCDD2', // red-lighten-4 ,
        color: '#D32F2F', // red-darken-2 ,
      },
      dark: {
        bgColor: '#B71C1C', // red-darken-4 ,
        color: '#FF5252', // red-accent-2 ,
      },
    },
  },
}

const VUETIFY_RUN_COMPLETED_DISPLAY: Record<
  RunCompleted['overallResult'],
  RunDisplayConfig
> = {
  GREEN: {
    icon: 'mdi-check-circle-outline',
    theme: {
      light: {
        bgColor: '#C8E6C9', // green-ligthen-4 ,
        color: '#388E3C', // green-darken-2 ,
      },
      dark: {
        bgColor: '#388E3C', // green-darken-2 ,
        color: '#43A047', // green-darken-1 ,
      },
    },
  },
  YELLOW: {
    icon: 'mdi-alert-outline',
    theme: {
      light: {
        bgColor: '#43A047', // amber-lighten-4 ,
        color: '#FFA000', // amber-darken-2 ,
      },
      dark: {
        bgColor: '#827717', // lime-darken-4 ,
        color: '#FFCA28', // amber-lighten-1 ,
      },
    },
  },
  RED: {
    icon: 'mdi-alert-circle-outline',
    theme: {
      light: {
        bgColor: '#FFCDD2', // red-lighten-4 ,
        color: '#D32F2F', // red-darken-2 ,
      },
      dark: {
        bgColor: '#B71C1C', // red-darken-4 ,
        color: '#D32F2F', // red-darken-2 ,
      },
    },
  },
  PENDING: {
    icon: 'mdi-dots-horizontal-circle-outline',
    theme: {
      light: {
        bgColor: '#F5F5F5', // grey-lighten-4 'var(--background)',
        color: '#BDBDBD', // grey-lighten-1 ,
      },
      dark: {
        bgColor: '#616161', // grey-darken-2 ,
        color: '#F5F5F5', // grey-lighten-4 ,
      },
    },
  },
  UNANSWERED: {
    icon: 'mdi-help-circle-outline',
    theme: {
      light: {
        bgColor: '#F5F5F5', // grey-lighten-4 'var(--background)',
        color: '#BDBDBD', // grey-lighten-1 ,
      },
      dark: {
        bgColor: '#616161', // grey-darken-2 ,
        color: '#F5F5F5', // grey-lighten-4 ,
      },
    },
  },
  FAILED: {
    icon: 'mdi-alert-octagon-outline',
    theme: {
      light: {
        bgColor: '#FFCDD2', // red-lighten-4 ,
        color: '#D32F2F', // red-darken-2 ,
      },
      dark: {
        bgColor: '#B71C1C', // red-darken-4 ,
        color: '#FF5252', // red-accent-2 ,
      },
    },
  },
  ERROR: {
    icon: 'mdi-bug-outline',
    theme: {
      light: {
        bgColor: '#FFCDD2', // red-lighten-4 ,
        color: '#B71C1C', // red-darken-4 ,
      },
      dark: {
        bgColor: '#B71C1C', // red-darken-4 ,
        color: '#FF5252', // red-accent-2 ,
      },
    },
  },
  NA: {
    icon: 'mdi-cancel',
    theme: {
      light: {
        bgColor: '#64B5F6', // blue-lighten-2 'var(--minor-signal-neutral__enabled__fill__default)',
        color: '#0D47A1', // blue-darken-4 'var(--minor-signal-neutral__enabled__front__default)',
      },
      dark: {
        bgColor: '#64B5F6', // blue-lighten-2 'var(--minor-signal-neutral__enabled__fill__default)',
        color: '#0D47A1', // blue-darken-4 'var(--minor-signal-neutral__enabled__front__default)',
      },
    },
  },
}

const { colorScheme } = useColorScheme()

export const useRunStatusVuetify = (state: MaybeRef<RunState>): RunDisplay => {
  const display = reactiveComputed(() => {
    const { status, overallResult } = unref(state)
    const displayConfig =
      status === 'completed' && overallResult
        ? VUETIFY_RUN_COMPLETED_DISPLAY[overallResult]
        : VUETIFY_RUN_UNACCOMPLISHED_DISPLAY[status]
    const { theme, ...display } = displayConfig
    displayConfig.iconComponent = displayConfig.iconComponent
      ? markRaw(displayConfig.iconComponent)
      : undefined
    const currentTheme = theme[colorScheme.value ?? 'light']
    return {
      // set default properties to make them reactive
      icon: undefined,
      ...display,
      ...currentTheme,
    }
  })
  return display
}
