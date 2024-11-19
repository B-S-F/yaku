// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { MendEnvironment } from '../../../src/model/mendEnvironment'

export const envFixture: MendEnvironment = {
  alertsStatus: 'active',
  apiUrl: 'https://foo.bar',
  serverUrl: 'https://bar.foo',
  email: 'dummy1@some.gTLD',
  maxConcurrentConnections: 123,
  minConnectionTime: 321,
  orgToken: 'dummy2-token',
  projectToken: 'dummy3-token',
  reportType: 'vulnerabilities',
  resultsPath: 'dummy4-path',
  userKey: 'dummy1-userkey',
}
