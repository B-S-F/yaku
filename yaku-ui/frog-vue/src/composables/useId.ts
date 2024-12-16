// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export const useId = () => {
  const suffix = Date.now() + (Math.random() * 100000).toFixed() // avoid crypto API to be environment compatible
  const $id = (name?: string) => (name ? `${name}-${suffix}` : suffix)
  return { $id }
}
