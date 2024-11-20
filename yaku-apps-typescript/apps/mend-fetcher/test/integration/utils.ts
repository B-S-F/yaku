// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export const mendFetcherExecutable = `${__dirname}/../../dist/index.js`
export const MOCK_SERVER_PORT = 8080
export const defaultEnvironment = {
  MEND_API_URL: 'http://localhost:8080',
  MEND_SERVER_URL: 'http://localhost:8080',
  MEND_ORG_TOKEN: 'org-token',
  MEND_PROJECT_TOKEN: 'project-uuid',
  MEND_USER_EMAIL: 'user@domain.gTLD',
  MEND_USER_KEY: 'user-key',
}
