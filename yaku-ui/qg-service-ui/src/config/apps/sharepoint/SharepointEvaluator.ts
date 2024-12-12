// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { App } from '~/types/App'

export const sharepointEvaluator: App = {
  name: 'Sharepoint evaluator',
  envs: [
    {
      name: 'SHAREPOINT_EVALUATOR_CONFIG_FILE',
      description:
        'The rules for validating the downloaded files are defined in a separate config file as there might be many files to be checked or many rules for some files. This variable contains the path to the file. You can find more information on it right below. More on https://asr-docs.bswf.tech/autopilots/sharepoint/reference/sharepoint-evaluator-reference.html#the-evaluators-config-file.',
      optional: false,
      example: 'https://sites.inside-share2.org.com/sites/1234567/',
    },
  ],
}
