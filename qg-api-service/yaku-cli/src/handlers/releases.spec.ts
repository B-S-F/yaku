import { jest } from '@jest/globals'
import { listReleases, showRelease, deleteRelease } from './releases'
import {
  ApiClient,
  Release,
  ReleasePaginated,
} from '@B-S-F/yaku-client-lib'
import yp from '../yaku-prompts.js'

const testApiClient = new ApiClient({
  baseUrl: 'http://base.url',
  token: 'token',
})
const testNamespaceId = 1

describe('listReleases()', () => {
  let getReleasesSpy: any
  beforeEach(() => {
    getReleasesSpy = jest
      .spyOn(ApiClient.prototype, 'getReleases')
      .mockResolvedValue({} as ReleasePaginated)
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should call ApiClient.getReleases() without options', async () => {
    await listReleases(testApiClient, testNamespaceId, '', {})

    expect(getReleasesSpy).toHaveBeenCalledWith(1, {
      ascending: false,
      filterProperty: [],
      filterValues: [],
      itemCount: 20,
      page: 1,
    })
  })
  it('should call ApiClient.getReleases() with options', async () => {
    await listReleases(testApiClient, testNamespaceId, '2', {
      itemCount: '10',
      filterBy: 'property=value1,value2',
      sortBy: 'sortBy',
      ascending: false,
    })

    expect(getReleasesSpy).toHaveBeenCalledWith(1, {
      ascending: false,
      filterProperty: ['property'],
      filterValues: [['value1', 'value2']],
      itemCount: 10,
      page: 2,
      sortBy: 'sortBy',
    })
  })
})

describe('showRelease()', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should call ApiClient.getRelease()', async () => {
    const getReleaseSpy = jest
      .spyOn(ApiClient.prototype, 'getRelease')
      .mockResolvedValue({} as Release)

    await showRelease(testApiClient, testNamespaceId, '1')

    expect(getReleaseSpy).toHaveBeenCalled()
  })
})

describe('deleteRelease()', () => {
  let deleteReleaseSpy: any
  beforeEach(() => {
    deleteReleaseSpy = jest
      .spyOn(ApiClient.prototype, 'deleteRelease')
      .mockResolvedValue()
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should call only ApiClient.deleteRelease() when using --yes option', async () => {
    await deleteRelease(testApiClient, testNamespaceId, '1', {
      yes: true,
    })

    expect(deleteReleaseSpy).toHaveBeenCalled()
  })
  it('should call ApiClient.getRelease() with confirmation and then ApiClient.deleteRelease()', async () => {
    const getReleaseSpy = jest
      .spyOn(ApiClient.prototype, 'getRelease')
      .mockResolvedValue({} as Release)
    jest.spyOn(yp, 'confirm').mockResolvedValue(true)

    await deleteRelease(testApiClient, testNamespaceId, '1', {})

    expect(deleteReleaseSpy).toHaveBeenCalled()
    expect(getReleaseSpy).toHaveBeenCalled()
  })
  it('should not call ApiClient.deleteRelease() without confirmation', async () => {
    const getReleaseSpy = jest
      .spyOn(ApiClient.prototype, 'getRelease')
      .mockResolvedValue({} as Release)
    jest.spyOn(yp, 'confirm').mockResolvedValue(false)

    await deleteRelease(testApiClient, testNamespaceId, '1', {})

    expect(deleteReleaseSpy).not.toHaveBeenCalled()
    expect(getReleaseSpy).toHaveBeenCalled()
  })
})
