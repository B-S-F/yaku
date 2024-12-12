// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { suffixer } from './suffixer'

describe('suffix', () => {
  it('untouch the passed name if it is valid', () => {
    const name = 'test-name'
    const validator = () => true
    expect(suffixer(name, validator)).toBe(name)
  })

  it('append "-1" if the name is invalid once', () => {
    const name = 'test-name'
    const validator = (candidate: string) => candidate !== 'test-name'
    expect(suffixer(name, validator)).toBe(`${name}-1`)
  })

  it('append "-2" if the name is invalid twice', () => {
    const name = 'test-name'
    const validator = (candidate: string) =>
      candidate !== 'test-name' && candidate !== 'test-name-1'
    expect(suffixer(name, validator)).toBe(`${name}-2`)
  })

  it('append "-3" if the name is invalid for "-1" and "-2" ', () => {
    const name = 'test-name'
    const validator = (candidate: string) =>
      candidate !== 'test-name' &&
      candidate !== 'test-name-1' &&
      candidate !== 'test-name-2'
    expect(suffixer(name, validator)).toBe(`${name}-3`)
  })

  it('append "-1" if the name ends with "-copy"', () => {
    const name = 'test-name-copy'
    const validator = (candidate: string) => candidate !== 'test-name-copy'
    expect(suffixer(name, validator)).toBe(`${name}-1`)
  })

  it('append "-2" if the name ends with "-copy-2"', () => {
    const name = 'test-name-copy-1'
    const validator = (candidate: string) =>
      candidate !== 'test-name-copy' && candidate !== 'test-name-copy-1'
    expect(suffixer(name, validator)).toBe('test-name-copy-2')
  })
})
