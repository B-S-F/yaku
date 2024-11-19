// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { describe, it, expect } from 'vitest'

import SentenceBuilder from '../../src/sentence-builder'

describe('isPlural', () => {
  const sb = new SentenceBuilder()
  it('should not be plural on undefined quantity', () => {
    expect(sb.isPlural('')).toEqual(false)
  })

  it('should not be plural on singular quantity', () => {
    expect(sb.isPlural('one')).toEqual(false)
  })

  it('should be plural on plural quantity', () => {
    expect(sb.isPlural('any')).toEqual(true)
  })
})

describe('getOperation', () => {
  it('should contain the plural if quantity is defined', () => {
    const sb = new SentenceBuilder()
    const message = sb.getOperation('all', '', '', '', '')

    expect(message).toContain('all')
  })

  it('should contain the subject with underscores if it is defined', () => {
    const sb = new SentenceBuilder()
    const message = sb.getOperation('all', 'subject', '', '', '')

    expect(message).toContain('_subject_')
  })

  it('should contain the reference with underscores if it is defined', () => {
    const sb = new SentenceBuilder()
    const message = sb.getOperation('all', 'subject', 'reference', '', '')

    expect(message).toContain('_reference_')
  })

  it('should contain the proper conjunction for plural', () => {
    const sb = new SentenceBuilder()
    const message = sb.getOperation('all', 'subject', 'reference', '', '')

    expect(message).toContain('are')
  })

  it('should contain the proper conjunction for singular', () => {
    const sb = new SentenceBuilder()
    const message = sb.getOperation('one', 'subject', 'reference', '', '')

    expect(message).toContain('is')
  })

  it('should contain the operation', () => {
    const sb = new SentenceBuilder()
    const message = sb.getOperation('one', 'subject', 'reference', '===', '')

    expect(message).toContain('===')
  })

  it('should contain the receiver with underscores', () => {
    const sb = new SentenceBuilder()
    const message = sb.getOperation(
      'one',
      'subject',
      'reference',
      '===',
      'receiver'
    )

    expect(message).toContain(`_receiver_`)
  })
})
