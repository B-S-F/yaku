// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export type MenuItemProps = {
  label?: string
  hasArrowRight?: boolean
  hasArrowDown?: boolean
  iconName?: string
  iconRight?: string
  isDisabled?: boolean
  href?: string
  target?: '_blank' | '_self' | '_parent' | '_top' | 'framename'
  groupId?: string
  btnListener?: CallableFunction
}
