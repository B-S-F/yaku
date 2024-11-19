// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { jest } from '@jest/globals'
import { info } from './info'
import { ApiClient, VersionInformation } from '@B-S-F/yaku-client-lib'

const testApiClient = new ApiClient({
  baseUrl: 'http://base.url',
  token: 'token',
})

describe('info()', () => {
  let getServiceInfoSpy: any
  let consoleLogSpy: any
  beforeEach(() => {
    getServiceInfoSpy = jest
      .spyOn(ApiClient.prototype, 'getServiceInfo')
      .mockResolvedValue({
        imageVersion: '2.0',
        serviceVersion: '1.0',
      } as VersionInformation)
    consoleLogSpy = jest.spyOn(console, 'log').mockReturnValue()
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should call ApiClient.getServiceInfo() and present all fields as JSON', async () => {
    await info(testApiClient, {})
    expect(getServiceInfoSpy).toHaveBeenCalled()
    expect(consoleLogSpy).toHaveBeenCalledWith(
      JSON.stringify(
        {
          imageVersion: '2.0',
          serviceVersion: '1.0',
        },
        null,
        2,
      ),
    )
  })
  it('should call ApiClient.getServiceInfo() and present the value of the only specified field', async () => {
    await info(testApiClient, { only: 'imageVersion' })
    expect(getServiceInfoSpy).toHaveBeenCalled()
    expect(consoleLogSpy).toHaveBeenCalledWith('2.0')
  })
})
