// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { App } from '~/types/App'

export const manualAnswerEvaluator: App = {
  name: 'Manual Answer evaluator',
  envs: [
    {
      name: 'manual_answer_file',
      description: 'The path to the manual answer file.',
      example: './example-answer.md',
    },
    {
      name: 'expiration_time',
      description:
        'The time in which your answer expires since last modification date.',
      example: '14d',
    },
    {
      name: 'expiry_reminder_period',
      description:
        'How many days before expiration, should the manual answer be marked as YELLOW status.',
      example: '3d',
      optional: true,
    },
    {
      name: 'last_modified_date_override',
      description:
        'The last modified date will change if a file is e.g. downloaded, moved or copied. This environment variable will override the last modified date. The provided date should conform to ISO-8601',
      example: '2023-02-20T15:20:09Z',
      optional: true,
    },
  ],
}
