// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export interface MendEnvironment {
  alertsStatus:
    | 'all'
    | 'active'
    | 'ignored'
    | 'library_removed'
    | 'library_in_house'
    | 'library_whitelist'
  apiUrl: string
  serverUrl: string
  email: string
  maxConcurrentConnections: number
  minConnectionTime: number
  orgToken: string
  projectId: number | undefined
  projectToken: string
  reportType: 'alerts' | 'vulnerabilities'
  resultsPath: string
  userKey: string
}
