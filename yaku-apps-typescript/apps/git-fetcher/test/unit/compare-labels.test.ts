import { describe, expect, it } from 'vitest'
import { GithubLabel } from '../../src/model/github-label'
import { compareLabels } from '../../src/utils/compare-labels'

const requiredLabels = ['foo', 'bar']

describe('CompareLables', () => {
  it('returns true, when all expected labels are part of the fetched labels', () => {
    const fetchedLabels: GithubLabel[] = [
      { id: 1, name: 'foo' },
      { id: 2, name: 'bar' },
    ]

    const result: boolean = compareLabels(requiredLabels, fetchedLabels)
    expect(result).toBe(true)
  })

  it('returns true, when all expected labels are part of the fetched labels, also when more labels are returned as required.', () => {
    const fetchedLabels: GithubLabel[] = [
      { id: 1, name: 'foo' },
      { id: 2, name: 'bar' },
      { id: 3, name: 'fooBar' },
    ]

    const result: boolean = compareLabels(requiredLabels, fetchedLabels)
    expect(result).toBe(true)
  })

  it('returns false, when none of the expected labels have been fetched.', () => {
    const fetchedLabels: GithubLabel[] = [{ id: 1, name: 'fooBar' }]

    const result: boolean = compareLabels(requiredLabels, fetchedLabels)
    expect(result).toBe(false)
  })

  it('returns false, when required labels array is empty.', () => {
    const fetchedLabels: GithubLabel[] = [{ id: 1, name: 'fooBar' }]
    const result: boolean = compareLabels([], fetchedLabels)
    expect(result).toBe(false)
  })

  it('returns false, when fetched labels object is empty.', () => {
    const result = compareLabels(requiredLabels, [])
    expect(result).toBe(false)
  })
})
