// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { Mapping } from '~/types'

export const COLUMN_MAPPING_ITEM: Mapping[] = [
  {
    label: 'Chapter',
    description:
      'The chapter attribute should be assigned to the column which contains the category of a QG question. The category is later used to group questions in the QG report so that all questions of one allocation/category appear together in a list.',
  },
  {
    label: 'ID',
    description:
      'The ID attribute should be assigned to the column which contains a unique identifier for a QG question. It can contain numbers and letters. Often it contains two numbers of which the first number identifies the allocation and the second one the question itself, e.g. "2.6".',
  },
  {
    label: 'Title',
    description:
      'The title attribute should be assigned to the column which contains the actual requirement. The requirement usually contains a description of the expected status. Only when the expected status is fulfilled, the question is considered to have been answered successfully.',
  },
  {
    label: 'Text',
    description:
      'The text attribute should be assigned to the column which contains additional information about how to fulfill the requirement. For example, this could include detailed descriptions of which documents need to be checked and how. If the check for the fulfillment of the requirement should be performed automatically, the necessary steps must be described sufficiently detailed.',
  },
]

export const FILTER_MAPPING_ITEM: Mapping = {
  label: 'Filter',
  description:
    'The filter attribute should be assigned to the column which limits the considered questions. Only rows with content will be considered in the QG configuration.',
}

/**
 * comma separated file format that can be processed to generate a configuration file.
 * As of 2022-12-16, the service uses the package https://www.npmjs.com/package/xlsx,
 * so every supported format by this package is also supported by the service.
 */
export const ACCEPTED_FILE_FORMAT: string =
  '.xlsx,.xlsm,.xlsb,.xls,.ssml,.xltx,.xltm,.numbers,.ods,.fods,.wks,.xlr'

/**
 * Template starter when starting from an empty configuration
 */
export const TEMPLATE_EMPTY_YAML_CONFIG = `metadata:
  version: v1
header:
  name: 'My component'
  version: 0.1.1
autopilots:
  security-scanner:
    run: |
      security-scanner
    env:
      # Provide your credentials as secrets to be able to use this autopilot
      GIT_TOKEN: <YOUR_GITHUB_PAT>
      GIT_REPO_URL: <YOUR_GITHUB_REPO>
chapters:
  '1':
    title: Scan a git repository for security vulnerabilities.
    requirements:
      '1':
        title: Scan a git repository for security vulnerabilities.
        text: Make sure the new release code doesn't contain any security vulnerabilities.
        checks:
          '1':
            title: 'Run security scanner'
            automation:
              autopilot: security-scanner
  '2':
    title: Verify allowed OSS licenses
    requirements:
      '1':
        title: Verify that SW dependencies contain only approved licenses
        text: Long description
        checks:
          '1':
            title: 'Description of the check'
            manual:
              reason: This check will be configured later
              status: UNANSWERED
  '3':
    title: Verify docker image OSS licenses
    requirements:
      '1':
        title: Verify that docker image contains package with allowed licenses
        text: Long description
        checks:
          '1':
            title: 'Description of the check'
            manual:
              reason: This check will be configured later
              status: UNANSWERED
  '4':
    title: SBOM is stored for each release
    requirements:
      '1':
        title: Make sure SBOM was generated and stored
        text: Long description - fill me out
        checks:
          '1':
            title: 'Description of the check - fill me out'
            manual:
              reason: This check will be configured later
              status: UNANSWERED
  '5':
    title: Unit test coverage > 80%
    requirements:
      '1':
        title: Check whether new release didn't deteriorate test coverage
        text: Long description - fill me out
        checks:
          '1':
            title: 'Description of the check - fill me out'
            manual:
              reason: This check will be configured later
              status: UNANSWERED
  '6':
    title: Release notes were generated
    requirements:
      '1':
        title: Release notes are generated and stored in the right location
        text: Long description - fill me out
        checks:
          '1':
            title: 'Description of the check - fill me out'
            manual:
              reason: This check will be configured later
              status: UNANSWERED
  '7':
    title: All commits have PRs
    requirements:
      '1':
        title: Every commit was reviewed before it landed to master
        text: Long description - fill me out
        checks:
          '1':
            title: 'Description of the check - fill me out'
            manual:
              reason: This check will be configured later
              status: UNANSWERED
  '8':
    title: Coding standards were followed
    requirements:
      '1':
        title: Coding best practices were verified with OpenAI scanner
        text: Long description - fill me out
        checks:
          '1':
            title: 'Description of the check - fill me out'
            manual:
              reason: This check will be configured later
              status: UNANSWERED
  '9':
    title: Azure defender alerts were resolved
    requirements:
      '1':
        title: Cloud infrastructure was configured according to best practices
        text: Long description - fill me out
        checks:
          '1':
            title: 'Description of the check - fill me out'
            manual:
              reason: This check will be configured later
              status: UNANSWERED
`
