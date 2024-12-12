// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { App } from '~/types/App'

export const jsonEvaluator: App = {
  name: 'Json evaluator',
  envs: [
    {
      name: 'JSON_INPUT_FILE',
      example: 'example-input.json',
      description: 'The filename of the JSON formatted data to evaluate.',
    },
    {
      name: 'JSON_CONFIG_FILE',
      example: 'evaluator-config.yaml',
      description:
        "The path of the evaluator's configuration file. More details about the config file can be found right below.",
    },
  ],
}
