// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export const isFocusable = (
  el: HTMLElement | null | undefined,
): el is HTMLElement => !!el && !el.hasAttribute('disabled') && el.tabIndex >= 0

export const getFocusableTreeWalker = (root: Node | HTMLElement) => {
  return document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (node) =>
      isFocusable(node as HTMLElement)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_SKIP,
  })
}
