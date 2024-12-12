// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import DOMPurify from 'dompurify'
import MarkdownIt from 'markdown-it'
import smartquotes from 'smartquotes'
import { unref } from 'vue'
import { renderLinkAsExternal } from './renderLinkAsExternal'

const DOM_PURIFY_CONFIG = {
  // allow target attribute for renderLinkAsExternal
  ADD_ATTR: ['target'],
}

/** smartquotes the whole content except the code blocks */
const smartquotesNoCode = (content: string | undefined) => {
  if (!content) return ''
  return String(content)
    .split(/(```.*```|`[^`]*`|^(?:\t| {4})[^\n]*$)/ms)
    .map((t) =>
      t.startsWith('`') || t.startsWith('	') || t.startsWith('    ')
        ? t
        : smartquotes(t),
    )
    .join('')
}

const md = new MarkdownIt({
  breaks: true,
})
md.use(renderLinkAsExternal)

const render = (
  markdownSrc: string | undefined,
  options: markdownit.Options & { type?: 'inline' | 'block' },
) => {
  md.set(options)
  return options.type === 'block'
    ? md.render(smartquotesNoCode(markdownSrc))
    : md.renderInline(smartquotesNoCode(markdownSrc))
}

export const formatMdContent = (
  content: string,
  options: MarkdownIt.Options & { type?: 'inline' | 'block' } = {
    linkify: true,
  },
) => DOMPurify.sanitize(render(unref(content), options), DOM_PURIFY_CONFIG)
