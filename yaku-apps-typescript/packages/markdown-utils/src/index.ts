/**
 * Copyright (c) 2022, 2023 by grow platform GmbH
 */

import MarkdownIt from 'markdown-it'
import { createRequire } from 'module'
import { titleCase } from 'title-case'

const require = createRequire(import.meta.url)
const smartquotes = require('smartquotes')

const md = new MarkdownIt({
  breaks: true,
  linkify: true,
})

function smartquotesNoCode(markdown: any) {
  if (!markdown) return ''
  // Don't convert to smart quotes in code blocks:
  return String(markdown)
    .split(/(```.*```|`[^`]*`|^(?:\t| {4})[^\n]*$)/ms)
    .map((t) =>
      t.startsWith('`') || t.startsWith('\t') || t.startsWith('    ')
        ? t
        : smartquotes(t)
    )
    .join('')
}

const markdown = {
  blockquote(text: string) {
    if (!text) return ''
    return text.replace(/^/gm, '> ')
  },

  buildOptionalLink(text: any, url: any) {
    if (!url) return text
    return `[${text}](${url})`
  },

  smartquotes: smartquotesNoCode,
  titleCase,

  render(markdownSrc: any) {
    return md.render(smartquotesNoCode(markdownSrc) || '')
  },

  renderInline(markdownSrc: any) {
    return md.renderInline(smartquotesNoCode(markdownSrc) || '')
  },

  prettyTime(date?: Date | number) {
    date ??= new Date()
    if (typeof date === 'number') date = new Date(date)
    return date.toLocaleString('sv', { timeZoneName: 'short' })
  },
}

export default markdown
