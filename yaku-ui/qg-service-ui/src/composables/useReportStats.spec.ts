// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { describe } from 'vitest'
import { useReportStats } from './useReportStats'
import { load } from 'js-yaml'
import runResultRed from '~/mocks/fixtures/qgResultV0/qg-result--red.yaml?raw'
import runResultGreen from '~/mocks/fixtures/qgResultV0/qg-result--green.yaml?raw'
import runResultUnanswered from '~/mocks/fixtures/qgResultV0/qg-result--unanswered.yaml?raw'
import { RunResultV0 } from '~/types/RunResult'
import { convertRunResultToReport } from '~helpers'

describe('useReportStats', () => {
  it('returns the expected values with a successful run', () => {
    const runResult = load(runResultGreen) as RunResultV0
    const report = convertRunResultToReport(runResult)!.report
    const stats = useReportStats({ report })
    expect(stats).toMatchSnapshot()
  })

  it('returns the expected values with a failed run', () => {
    const runResult = load(runResultRed) as RunResultV0
    const report = convertRunResultToReport(runResult)!.report
    const stats = useReportStats({ report })
    expect(stats).toMatchSnapshot()
  })

  it('returns the expected values with 100% unanswered', () => {
    const runResult = load(runResultUnanswered) as RunResultV0
    const report = convertRunResultToReport(runResult)!.report
    const stats = useReportStats({ report })
    expect(stats).toMatchSnapshot()
  })
})
