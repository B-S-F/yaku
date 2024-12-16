// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import RunFailedFilledIcon from './RunFailedFilledIcon.vue'
import VuetifyPendingIcon from './VuetifyPendingIcon.vue'
import VuetifyRunCompletedIcon from './VuetifyRunCompletedIcon.vue'

export type RunIcon =
  | typeof RunFailedFilledIcon
  | typeof VuetifyPendingIcon
  | typeof VuetifyRunCompletedIcon

export { RunFailedFilledIcon, VuetifyPendingIcon, VuetifyRunCompletedIcon }
