// SPDX-FileCopyrightText: 2022 2023 by grow platform GmbH
// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest'
import markdown from '../src/index'

const textblock = `abc
def`

const textblock__quoted = `> abc
> def`

describe('blockquote', function () {
  it('replaces the first character of a string with a quote', function () {
    expect(markdown.blockquote('test')).toEqual('> test')
  })
  it('replaces the first character of each line with a quote', function () {
    expect(markdown.blockquote(textblock)).toEqual(textblock__quoted)
  })
  it('does not quote an empty string', function () {
    expect(markdown.blockquote('')).toEqual('')
  })
  it('increases quotation level', function () {
    expect(markdown.blockquote('> test')).toEqual('> > test')
  })
})

describe('buildOptionalLink', function () {
  it('returns the text if no url is provided', function () {
    expect(markdown.buildOptionalLink('test', '')).toEqual('test')
  })
  it('returns a valid markdown link if url is provided', function () {
    expect(markdown.buildOptionalLink('test', 'https://test.com')).toEqual(
      '[test](https://test.com)'
    )
  })
  it('returns the text as is if no url is provided', function () {
    expect(markdown.buildOptionalLink(3, null)).toEqual(3)
  })
  it('converts a number to a string and returns valid markdown link if url is provided', function () {
    expect(markdown.buildOptionalLink(3, 'https://test.com')).toEqual(
      '[3](https://test.com)'
    )
  })
})

const textWithSourceBlock = `"Hello, it's 'me'!"

"foo":\t"bar"

\`\`\`json
{
  "foo": "bar",
  "baz": "qux"
}
\`\`\`

\tfoo: 'bar'
\tbaz: 'qux'
`

const textWithSourceBlock__typography = `“Hello, it’s ‘me’!”

“foo”:\t“bar”

\`\`\`json
{
  "foo": "bar",
  "baz": "qux"
}
\`\`\`

\tfoo: 'bar'
\tbaz: 'qux'
`

describe('smartquotes', function () {
  it('converts double quotes to typography quotes', function () {
    expect(markdown.smartquotes('"test"')).toEqual('“test”')
  })
  it('converts single quotes to typography quotes', function () {
    expect(markdown.smartquotes("'test'")).toEqual('‘test’')
  })
  it('converts apostrophies quotes to typography apostrophies', function () {
    expect(markdown.smartquotes('"Hello, it\'s me')).toEqual('“Hello, it’s me')
  })
  it('ignores quotes in source code', function () {
    expect(markdown.smartquotes('"Hello" `"world"`')).toEqual(
      '“Hello” `"world"`'
    )
  })
  it('ignores quotes in code blocks', function () {
    expect(markdown.smartquotes(textWithSourceBlock)).toEqual(
      textWithSourceBlock__typography
    )
  })
  it('can handle null', function () {
    expect(markdown.smartquotes(null)).toEqual('')
  })
  it('converts a number', function () {
    expect(markdown.smartquotes(123)).toEqual('123')
  })
})

describe('titleCase', function () {
  it('converts a string to title case', function () {
    expect(markdown.titleCase('test test')).toEqual('Test Test')
  })
  it('converts umlauts to title case', function () {
    expect(markdown.titleCase('über test')).toEqual('Über Test')
  })
  it('does not convert articles and some small prepositions', function () {
    expect(markdown.titleCase('test in a world')).toEqual('Test in a World')
  })
  it('converts articles as the first letter', function () {
    expect(markdown.titleCase('in a world')).toEqual('In a World')
  })
})

const markdownBlock = `# "Hello"

World!\t"Tab"

    foo: 'bar'
    baz: 'qux'

More:

\tfoo: 'bar'
\tbaz: 'qux'
\`'foo2bar'\`
`

const markdownBlock__rendered = `<h1>“Hello”</h1>
<p>World!\t“Tab”</p>
<pre><code>foo: 'bar'
baz: 'qux'
</code></pre>
<p>More:</p>
<pre><code>foo: 'bar'
baz: 'qux'
</code></pre>
<p><code>'foo2bar'</code></p>
`

describe('render', function () {
  it('renders markdown format', function () {
    expect(markdown.render('**test**')).toEqual(
      '<p><strong>test</strong></p>\n'
    )
  })
  it('renders markdown block and uses typographic quotes outside of code', function () {
    expect(markdown.render(markdownBlock)).toEqual(markdownBlock__rendered)
  })
})

describe('renderInline', function () {
  it('renders markdown format and uses typographic quotes', function () {
    expect(markdown.renderInline('**"Test"**')).toEqual(
      '<strong>“Test”</strong>'
    )
  })
  it('converts a number to a string', function () {
    expect(markdown.renderInline(3)).toEqual('3')
  })
})
