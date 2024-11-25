/**
 * Copyright (c) 2022, 2023 by grow platform GmbH 
 */

import baseConfig from '@B-S-F/eslint-config/eslint-preset.js';

export default {
  ...baseConfig[0],
  rules: {
    ...baseConfig[0].rules,
    "no-control-regex": 0,
    "no-restricted-imports": ["error", {
      "patterns": ["*.js"]
    }]
}
};
