// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import VuetifyManuallyResolved from '~/icons/findingsIcons/VuetifyManuallyResolved.vue'
import { VuetifyPendingIcon } from '~/icons/runIcons'
import RunFailedFilledIcon from '~/icons/runIcons/RunFailedFilledIcon.vue'
import UnFulFilledCheck from '~/icons/runResultIcons/UnFulFilledCheck.vue'
import type {
  OverallResult,
  RunCompleted,
  RunState,
  RunUnaccomplished,
  Severity,
  StatusPillDisplay,
} from '~/types'
import { CheckColor } from '~/types/Release'

const RUN_STATUS_LABEL: Record<
  RunUnaccomplished['status'] | 'completed',
  string
> = {
  pending: 'Your run is about to start.',
  running: 'Your run is still being executed, please wait.',
  completed: 'Your run finished without further information.',
  failed:
    'The run failed and could therefore not be completed. No result available.',
}

const RUN_RESULT_LABEL: Record<RunCompleted['overallResult'], string> = {
  GREEN: 'The run was completed and all checks passed successfully.',
  YELLOW: 'The QG run was run through with yellow.',
  RED: 'The run was completed but one or more checks did not pass.',
  FAILED: 'The run failed with runtime errors.',
  PENDING: 'PENDING: No checks are configured.',
  UNANSWERED: 'Unanswered',
  ERROR: 'Autopilot configuration error',
  NA: 'Not applicable',
}

export const getRunLabel = (state: RunState) => {
  const { status, overallResult } = state
  return status === 'completed' && overallResult
    ? RUN_RESULT_LABEL[overallResult]
    : RUN_STATUS_LABEL[status]
}

export const getVuetifyRunPillFromOverallResult = (
  r?: OverallResult | string | null,
): StatusPillDisplay => {
  switch (r) {
    case 'GREEN':
      return {
        color: 'Success',
        label: 'Successful',
        tooltip: 'All checks passed.',
        icon: 'mdi-check-circle-outline',
        iconComponent: undefined,
      }

    case 'YELLOW':
      return {
        color: 'Warning',
        label: 'Warning',
        tooltip: 'All checks passed, but some with warnings.',
        icon: 'mdi-alert-outline',
        iconComponent: undefined,
      }

    case 'RED':
      return {
        color: 'LightError',
        label: 'Failed',
        tooltip: 'At least one check did not pass.',
        icon: 'mdi-alert-circle-outline',
        iconComponent: undefined,
      }

    case 'ERROR':
    case 'FAILED':
      return {
        color: 'Error',
        label: 'Error',
        tooltip: 'Run is completed but some autopilots failed.',
        icon: 'mdi-alert-octagon',
        iconComponent: undefined,
      }
    case 'PENDING':
      return {
        color: 'Unknown',
        label: 'Pending',
        tooltip: 'No checks are configured',
        icon: undefined,
        iconComponent: VuetifyPendingIcon,
      }
    case 'NA':
      return {
        color: 'Info',
        label: '',
        tooltip: 'All checks are not applicable or unanswered.',
        icon: 'mdi-cancel',
        iconComponent: undefined,
      }
    default:
      return {
        color: 'Unknown',
        label: 'Unanswered',
        tooltip: "Some checks can't be solved automatically.",
        icon: 'mdi-help-circle-outline',
        iconComponent: undefined,
      }
  }
}

export const getVuetifyRunPillInfo = (
  run:
    | Pick<RunCompleted, 'status' | 'overallResult'>
    | Pick<RunUnaccomplished, 'status' | 'overallResult'>,
): StatusPillDisplay => {
  switch (run.status) {
    case 'completed':
      return getVuetifyRunPillFromOverallResult(run.overallResult)

    case 'failed':
      return {
        color: 'Error',
        label: 'Error',
        tooltip: 'The run could not be completed due to runtime errors.',
        icon: undefined,
        iconComponent: RunFailedFilledIcon,
      }

    case 'running':
      return {
        color: 'Info',
        label: 'Running',
        tooltip: 'The run is currently in progress.',
        icon: 'mdi-refresh',
        iconComponent: undefined,
      }

    case 'pending':
      return {
        color: 'Unknown',
        label: 'Pending',
        tooltip: 'The run is being prepared to start.',
        icon: 'mdi-dots-horizontal-circle-outline',
        iconComponent: undefined,
      }
  }
}

export const getResultPillFromStatus = (
  s?:
    | 'GREEN'
    | 'YELLOW'
    | 'RED'
    | 'ERROR'
    | 'FAILED'
    | 'UNANSWERED'
    | 'NA'
    | 'PENDING'
    | string
    | null,
  manualResolved = false,
): StatusPillDisplay => {
  switch (s) {
    case 'GREEN':
      return {
        color: 'Success',
        label: '',
        tooltip: 'Check passed',
        ...(manualResolved
          ? {
              iconComponent: VuetifyManuallyResolved,
              icon: undefined,
            }
          : {
              icon: 'mdi-check-circle-outline',

              iconComponent: undefined,
            }),
      }

    case 'YELLOW':
      return {
        color: 'Warning',
        label: '',
        tooltip: 'Check passed with warnings',
        ...(manualResolved
          ? {
              iconComponent: VuetifyManuallyResolved,
              icon: undefined,
            }
          : {
              icon: 'mdi-alert-outline',
              iconComponent: undefined,
            }),
      }

    case 'RED':
      return {
        color: 'LightError',
        label: '',
        tooltip: 'Check did not pass',
        ...(manualResolved
          ? {
              iconComponent: VuetifyManuallyResolved,
              icon: undefined,
            }
          : {
              icon: 'mdi-alert-circle-outline',
              iconComponent: undefined,
            }),
      }

    case 'ERROR':
      return {
        color: 'Error',
        label: '',
        tooltip: 'Autopilot configuration error',
        icon: 'mdi-bug-outline',
        iconComponent: undefined,
      }

    case 'FAILED':
      return {
        color: 'Error',
        label: '',
        tooltip: 'Autopilot failed with runtime error',
        ...(manualResolved
          ? {
              iconComponent: VuetifyManuallyResolved,
              icon: undefined,
            }
          : {
              icon: 'mdi-alert-octagon',
              iconComponent: undefined,
            }),
      }

    case 'UNANSWERED':
      return {
        color: 'Unknown',
        label: '',
        tooltip: 'Unanswered',
        icon: 'mdi-help-circle-outline',
        iconComponent: undefined,
      }

    case 'NA':
      return {
        color: 'Info',
        label: '',
        tooltip: 'Check not applicable',
        icon: 'mdi-cancel',
        iconComponent: undefined,
      }

    case 'PENDING':
      return {
        color: 'Unknown',
        label: '',
        tooltip: 'PENDING: No check configured',
        icon: 'mdi-clock-time-three-outline',
        iconComponent: undefined,
      }

    default:
      return {
        color: 'Unknown',
        label: '',
        tooltip: '',
        icon: 'mdi-help-circle-outline',
        iconComponent: undefined,
      }
  }
}

export const getSeverityPillInfo = (s: Severity): StatusPillDisplay => {
  switch (s) {
    case 'LOW':
      return {
        color: 'Success',
        label: 'Low',
        tooltip: '',
        icon: 'alert-success',
        iconComponent: undefined,
      }

    case 'MEDIUM':
      return {
        color: 'Warning',
        label: 'Medium',
        tooltip: '',
        icon: 'alert-warning',
        iconComponent: undefined,
      }

    case 'HIGH':
      return {
        color: 'LightError',
        label: 'High',
        tooltip: '',
        icon: 'problem-frame',
        iconComponent: undefined,
      }

    case 'CRITICAL':
      return {
        color: 'Error',
        label: 'Critical',
        tooltip: '',
        icon: 'alert-error-filled',
        iconComponent: undefined,
      }

    case 'UNKNOWN':
      return {
        color: 'Info',
        label: 'Unknown',
        tooltip: '',
        icon: 'denied',
        iconComponent: undefined,
      }

    default:
      return {
        color: 'Unknown',
        label: '',
        tooltip: '',
        icon: 'question-frame',
        iconComponent: undefined,
      }
  }
}

export const getVuetifyReleaseStatusPillInfo = (
  status: string,
): StatusPillDisplay => {
  switch (status) {
    case 'approved':
      return {
        color: 'Success',
        label: 'Approved',
        tooltip: 'Release is approved.',
        icon: 'mdi-check-circle-outline',
        iconComponent: undefined,
      }
    case 'closed':
      return {
        color: 'Info',
        label: 'Closed',
        tooltip: 'Release is closed.',
        icon: 'mdi-archive-outline',
        iconComponent: undefined,
      }
    default:
      return {
        color: 'Unknown',
        label: 'Pending',
        tooltip: 'Release is pending.',
        icon: 'mdi-dots-horizontal-circle-outline',
        iconComponent: undefined,
      }
  }
}

export const getVuetifyFindingStatusPill = (
  status?: string,
  autoResolved = false,
): StatusPillDisplay => {
  switch (status) {
    case 'resolved':
      return {
        color: 'Success',
        label: autoResolved ? 'Resolved' : 'Manually set to resolved',
        tooltip: 'This finding is resolved.',
        ...(autoResolved
          ? {
              icon: 'mdi-check-circle-outline',
              iconComponent: undefined,
            }
          : {
              iconComponent: VuetifyManuallyResolved,
              icon: undefined,
            }),
      }
    default:
      return {
        color: 'Unknown',
        label: 'Unresolved',
        tooltip: 'This finding has not been resolved yet.',
        icon: 'mdi-dots-horizontal-circle-outline',
        iconComponent: undefined,
      }
  }
}

export const getCheckStatusPill = (fulfilled?: boolean): StatusPillDisplay => {
  if (fulfilled) {
    return {
      color: 'Success',
      label: 'Fulfilled',
      tooltip: 'The check has been fulfilled.',
      icon:
        import.meta.env.VITE_TEST_VUETIFY_UI === 'true'
          ? 'mdi-check-circle-outline'
          : 'alert-success',
      iconComponent: undefined,
    }
  }
  return {
    color: 'LightError',
    label: 'Not fulfilled',
    tooltip: 'The check has not been fulfilled.',
    icon: undefined,
    iconComponent: UnFulFilledCheck,
  }
}

export const selectedResultBarPills: { [key: string]: Record<string, string> } =
  {
    FAILED: {
      bg: '#ff2124',
      color: '#ffffff',
      icon:
        import.meta.env.VITE_TEST_VUETIFY_UI === 'true'
          ? 'mdi-alert-octagon'
          : 'alert-error-filled',
    },
    YELLOW: {
      bg: '#ffcf00',
      color: '#000000',
      icon:
        import.meta.env.VITE_TEST_VUETIFY_UI === 'true'
          ? 'mdi-alert-outline'
          : 'alert-warning',
    },
    GREEN: {
      bg: '#00884a',
      color: '#ffffff',
      icon:
        import.meta.env.VITE_TEST_VUETIFY_UI === 'true'
          ? 'mdi-check-circle-outline'
          : 'alert-success',
    },
    NA: {
      bg: '#007bc0',
      color: '#ffffff',
      icon:
        import.meta.env.VITE_TEST_VUETIFY_UI === 'true'
          ? 'mdi-cancel'
          : 'denied',
    },
    UNANSWERED: {
      bg: '#e0e2e5',
      color: '#000000',
      icon:
        import.meta.env.VITE_TEST_VUETIFY_UI === 'true'
          ? 'mdi-file-minus-outline'
          : 'document-plain-delete',
    },
    MANUAL: {
      bg: '#9e2896',
      color: '#ffffff',
      icon:
        import.meta.env.VITE_TEST_VUETIFY_UI === 'true'
          ? 'mdi-account-check'
          : 'user-check',
    },
  }

export const textMap: Map<CheckColor, string> = new Map([
  [CheckColor.GREEN, 'Passed'],
  [CheckColor.YELLOW, 'Passed with warning'],
  [CheckColor.RED, 'Not passed'],
  [CheckColor.UNANSWERED, 'Unanswered'],
])
