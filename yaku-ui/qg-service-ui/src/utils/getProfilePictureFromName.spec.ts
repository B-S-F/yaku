// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { getProfilePictureFromName } from './getProfilePictureFromName'

describe('getProfilePictureFromName', () => {
  const tests = [
    ['Azure DevOps', 'AD'],
    ['Artifactory', 'Af'],
    ['Docupedia', 'Dp'],
    ['Git', 'Gt'],
    ['Jira', 'Ja'],
    ['Sharepoint', 'Sp'],
    ['Splunk', 'Sk'],
    ['SonarQube', 'SQ'],
    ['security-scanner', 'ss'],
  ]

  tests.forEach(([input, result]) => {
    it(`${input} -> ${result}`, () => {
      expect(getProfilePictureFromName(input)).toStrictEqual(result)
    })
  })
})
