import { expect } from 'vitest'
import {
  MockServer,
  RunProcessResult,
} from '../../../../integration-tests/src/util'
import { verifyNoOutputFileWasWritten } from './common'

export function verifyError(
  result: RunProcessResult,
  expectedErrorMessage: string,
  mockServer: MockServer
): void {
  expect(result.exitCode).toEqual(1)
  expect(result.stdout).length(0)
  expect(result.stderr[0]).toEqual(expectedErrorMessage)
  expect(mockServer.getNumberOfRequests()).toEqual(0)
  verifyNoOutputFileWasWritten()
}
