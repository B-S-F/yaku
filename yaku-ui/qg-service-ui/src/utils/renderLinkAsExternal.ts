// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type MarkdownIt from 'markdown-it'
import type StateCore from 'markdown-it/lib/rules_core/state_core'

/**
 * Markdown-it plugin to open every parsed link into a new tab.
 * The plugin add target="_blank" to every link
 */
export const renderLinkAsExternal: MarkdownIt.PluginSimple = (md) => {
  const addBlanks = (tokens: StateCore['tokens']) => {
    tokens.forEach((t) => {
      if (t.type === 'link_open') t.attrPush(['target', '_blank'])
      if (t.children) addBlanks(t.children)
    })
  }
  md.core.ruler.push('link_open', (state) => {
    addBlanks(state.tokens)
  })
}

export const ALLOW_TARGET_ATTR: NonNullable<
  DOMPurify.Config['ALLOWED_ATTR']
>[number] = 'target'
