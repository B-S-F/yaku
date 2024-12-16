// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export type ContextMenuLink = {
  label: string
  iconName?: string
  hasArrowDown?: boolean
  hasArrowRight?: boolean
  hasDivider?: boolean
  isDisabled?: boolean
  href?: string
  subNavigation?: ContextMenuLink[]
  groupId?: string
}
