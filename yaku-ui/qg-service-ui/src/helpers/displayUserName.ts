// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { NamespaceUser } from '~/api'

export const displayUserName = (user: NamespaceUser | string): string => {
  if (!user) return 'N/A'
  if ((typeof user as string) === 'string') return user as string
  return (user as NamespaceUser).displayName &&
    (user as NamespaceUser).displayName !== ' '
    ? (user as NamespaceUser).displayName
    : (user as NamespaceUser).username || (user as NamespaceUser).id
}
