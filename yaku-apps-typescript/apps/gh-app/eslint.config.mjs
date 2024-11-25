// SPDX-FileCopyrightText: 2022 2023 by grow platform GmbH
// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import baseConfig from '@B-S-F/eslint-config/eslint-preset.js';

export default {
  ...baseConfig[0],
  rules: {
    ...baseConfig[0].rules,
    "no-control-regex": 0,
}
};
