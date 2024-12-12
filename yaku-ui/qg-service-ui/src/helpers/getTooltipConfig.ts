// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { FrokComponents } from '@B-S-F/frog-vue'
import type { ExtractPublicPropTypes } from 'vue'

export const TOOLTIP_CONFIG: ExtractPublicPropTypes<
  FrokComponents['FrokPopover']
> = {
  attached: true,
  triggerOnHover: true,
  tooltipAlike: true,
  arrowPlacementClass: '-without-arrow-top',
}
