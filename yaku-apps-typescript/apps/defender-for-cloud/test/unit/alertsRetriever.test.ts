import axios from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getDefenderForCloudAlerts,
} from '../../src/alertsRetriever'
import {
  mockedAlertsUnitTestsFirstSet,
  mockedAlertsUnitTestsSecondSet,
  mockedAlertsUnitTestsThirdSet,
} from '../fixtures/alerts'

vi.mock('axios', () => ({
  default: {
    get: vi.fn()
  },
}))

const mockedAxiosGet = vi.mocked(axios.get)

describe('Test "getDefenderForCloudAlerts()" from "alertsRetriever.ts"', async () => {
  afterEach(() => {
    vi.clearAllMocks()
  })
  it('Should return a list of alerts if response status is 200', async () => {
    mockedAxiosGet.mockResolvedValueOnce({
      status: 200,
      data: {
        value: mockedAlertsUnitTestsFirstSet,
      },
    })

    const result = await getDefenderForCloudAlerts(
      'mockedToken',
      'mockTenantId'
    )
    expect(result).toEqual(mockedAlertsUnitTestsFirstSet)
  })

  it('Should return a list of alerts if response status is 200 and pagination is required', async () => {
    mockedAxiosGet.mockResolvedValueOnce({
      status: 200,
      data: {
        value: mockedAlertsUnitTestsFirstSet,
        nextLink: 'mockedLink1',
      },
    })

    mockedAxiosGet.mockResolvedValueOnce({
      status: 200,
      data: {
        value: mockedAlertsUnitTestsSecondSet,
        nextLink: 'mockedLink2',
      },
    })

    mockedAxiosGet.mockResolvedValueOnce({
      status: 200,
      data: {
        value: mockedAlertsUnitTestsThirdSet,
      },
    })

    const result = await getDefenderForCloudAlerts(
      'mockedToken',
      'mockTenantId'
    )
    expect(result).toEqual(
      mockedAlertsUnitTestsFirstSet
        .concat(mockedAlertsUnitTestsSecondSet)
        .concat(mockedAlertsUnitTestsThirdSet)
    )
  })

  it('Should throw a specific error if status is not 200', async () => {
    mockedAxiosGet.mockRejectedValueOnce({ 
      response: { 
        status: 400
      } })

    await expect(
      getDefenderForCloudAlerts('mockedToken', 'mockTenantId')
    ).rejects.toThrowError(
      'Request for Azure alerts does not have status code 200. Status code: 400'
    )
  })
})
