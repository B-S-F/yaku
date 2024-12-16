// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { _RouteLocationBase } from 'vue-router'

const isMenuItemSelected = (
  fullPath: _RouteLocationBase['fullPath'],
  target: string,
) => {
  const pathSegments = fullPath.split('/')
  if (pathSegments.length > 3) {
    const reg = new RegExp(target)
    return !!pathSegments.slice(3).join('/').match(reg)
  } else {
    return false
  }
}

export default isMenuItemSelected
