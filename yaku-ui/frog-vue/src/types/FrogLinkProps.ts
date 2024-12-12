// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { VBtn } from 'vuetify/components'

type VBtnProps = InstanceType<typeof VBtn>['$props']

export interface FrogLinkProps extends /* @vue-ignore */ VBtnProps {
  label?: string
  icon?: string
  iconLeft?: boolean
}
