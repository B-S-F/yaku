import axios from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getDefenderForCloudRecommendations,
  getDefenderForCloudRecommendationsMetadata,
} from '../../src/recommendationsRetriever'
import {
  mockedRecommendationsUnitTestsFirstSet,
  mockedRecommendationsUnitTestsSecondSet,
  mockedRecommendationsUnitTestsThirdSet,
  mockedRecommendationsMetadataUnitTestsFirstSet,
  mockedRecommendationsMetadataUnitTestsSecondSet,
  mockedRecommendationsMetadataUnitTestsThirdSet,
} from '../fixtures/recommendations'

vi.mock('axios', () => ({
  default: {
    get: vi.fn()
  },
}))

const mockedAxiosGet = vi.mocked(axios.get)

describe('Test "getDefenderForCloudRecommendations" from "recommendationsRetriever.ts"', async () => { 
  afterEach(() => {
    vi.clearAllMocks()
  })
  it('Should return a list of recommendations if response status is 200', async () => {
    mockedAxiosGet.mockResolvedValueOnce({
      status: 200,
      data: {
        value: mockedRecommendationsUnitTestsFirstSet,
      },
    })

    const result = await getDefenderForCloudRecommendations(
      'mockedToken',
      'mockTenantId'
    )
    expect(result).toEqual(mockedRecommendationsUnitTestsFirstSet)
  })

  it('Should return a list of recommendations if response status is 200 and pagination is required', async () => {
    mockedAxiosGet.mockResolvedValueOnce({
      status: 200,
      data: {
        value: mockedRecommendationsUnitTestsFirstSet,
        nextLink: 'mockedLink1',
      },
    })

    mockedAxiosGet.mockResolvedValueOnce({
      status: 200,
      data: {
        value: mockedRecommendationsUnitTestsSecondSet,
        nextLink: 'mockedLink2',
      },
    })

    mockedAxiosGet.mockResolvedValueOnce({
      status: 200,
      data: {
        value: mockedRecommendationsUnitTestsThirdSet,
      },
    })

    const result = await getDefenderForCloudRecommendations(
      'mockedToken',
      'mockTenantId'
    )
    expect(result).toEqual(
      mockedRecommendationsUnitTestsFirstSet
        .concat(mockedRecommendationsUnitTestsSecondSet)
        .concat(mockedRecommendationsUnitTestsThirdSet)
    )
  })

  it('Should throw a specific error if status is not 200', async () => {
    mockedAxiosGet.mockRejectedValueOnce({ 
      response: { 
        status: 400
      } })

    await expect(
      getDefenderForCloudRecommendations('mockedToken', 'mockTenantId')
    ).rejects.toThrowError(
      'Request for Azure recommendations does not have status code 200. Status code: 400'
    )
  })
})

describe('Test "getDefenderForCloudRecommendationsMetadata" from "recommendationsRetriever.ts"', async () => { 
  afterEach(() => {
    vi.clearAllMocks()
  })
  it('Should return a list of recommendations metadata if response status is 200', async () => {
    mockedAxiosGet.mockResolvedValueOnce({
      status: 200,
      data: {
        value: mockedRecommendationsMetadataUnitTestsFirstSet,
      },
    })

    const result = await getDefenderForCloudRecommendationsMetadata(
      'mockedToken'
    )
    expect(result).toEqual(mockedRecommendationsMetadataUnitTestsFirstSet)
  })

  it('Should return a list of recommendation metadata if response status is 200 and pagination is required', async () => {
    mockedAxiosGet.mockResolvedValueOnce({
      status: 200,
      data: {
        value: mockedRecommendationsMetadataUnitTestsFirstSet,
        nextLink: 'mockedLink1',
      },
    })

    mockedAxiosGet.mockResolvedValueOnce({
      status: 200,
      data: {
        value: mockedRecommendationsMetadataUnitTestsSecondSet,
        nextLink: 'mockedLink2',
      },
    })

    mockedAxiosGet.mockResolvedValueOnce({
      status: 200,
      data: {
        value: mockedRecommendationsMetadataUnitTestsThirdSet,
      },
    })

    const result = await getDefenderForCloudRecommendationsMetadata(
      'mockedToken'
    )
    expect(result).toEqual(
      mockedRecommendationsMetadataUnitTestsFirstSet
        .concat(mockedRecommendationsMetadataUnitTestsSecondSet)
        .concat(mockedRecommendationsMetadataUnitTestsThirdSet)
    )
  })

  it('Should throw a specific error if status is not 200', async () => {
    mockedAxiosGet.mockRejectedValueOnce({ 
      response: { 
        status: 400
      } })

    await expect(
      getDefenderForCloudRecommendationsMetadata('mockedToken')
    ).rejects.toThrowError(
      'Request for Azure recommendations metadata does not have status code 200. Status code: 400'
    )
  })
})