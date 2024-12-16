// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export type SideNavigationSubItemProps = {
  label: string
  href: string
  isDisabled?: boolean
}

export type SideNavigationMenuItemProps = {
  label: string
  icon: string
  href?: string
  isSelected?: boolean
  isDisabled?: boolean
  subItems?: SideNavigationSubItemProps[]
}

export type SideNavigationProps = {
  isOpen?: boolean
  menuItems: SideNavigationMenuItemProps[]
  appName: string
}
