// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { formatMdContent } from './formatMdContent'

describe('formatMdContent', () => {
  it('render basic text inside a paragraph', () => {
    const value = formatMdContent('Hello')
    expect(value).toStrictEqual('Hello')
  })

  it('render a simple link', () => {
    const link = 'https://example.com/'
    const value = formatMdContent(link, { linkify: true })
    expect(value).toStrictEqual(
      `<a target="_blank" href="https://example.com/">https://example.com/</a>`,
    )
  })

  it('render a link', () => {
    const link =
      'https://example.com/sites/OD_DOCUMENT_Plan.xlsx(1)/OD_Document_Plan_11.1.xlsx'
    const content = `Some text <${link}>`
    const value = formatMdContent(content, { linkify: true })
    expect(value).toStrictEqual(
      `Some text <a target="_blank" href="${link}">${link}</a>`,
    )
  })

  it('render a markdown link with square brackets', () => {
    const link =
      'https://example.com/OD_DOCUMENT_Plan.xlsx(1)/OD_Document_Plan_11.1.xlsx'
    const value = formatMdContent(`Some text [${link}](${link})`, {
      linkify: true,
    })
    expect(value).toStrictEqual(
      `Some text <a target="_blank" href="${link}">${link}</a>`,
    )
  })

  it('render a markdown link with angular brackets', () => {
    const link =
      'https://example.com/OD_DOCUMENT_Plan.xlsx(1)/OD_Document_Plan_11.1.xlsx'
    const value = formatMdContent(`Some text <${link}>`, { linkify: true })
    expect(value).toStrictEqual(
      `Some text <a target="_blank" href="${link}">${link}</a>`,
    )
  })
})
