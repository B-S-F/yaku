// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export type QuickLink = {
  icon: string
  label: string
}

export type SearchSuggestion = {
  text: string
  href: string
  highlight?: string
}

export type NavigationEntry = {
  label: string
  isExternal?: boolean
  href?: string
  subNavigation?: NavigationEntry[]
}
