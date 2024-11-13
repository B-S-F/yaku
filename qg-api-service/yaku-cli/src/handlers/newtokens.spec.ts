import { jest } from '@jest/globals'
import { listNewTokens, createNewToken, revokeNewToken } from './newtokens'
import { ApiClient, NewToken } from '@B-S-F/yaku-client-lib'

const testApiClient = new ApiClient({
  baseUrl: 'http://base.url',
  token: 'token',
})

describe('listNewTokens()', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should call ApiClient.listNewTokens()', async () => {
    const listNewTokensSpy = jest
      .spyOn(ApiClient.prototype, 'listNewTokens')
      .mockResolvedValue([])
    await listNewTokens(testApiClient)
    expect(listNewTokensSpy).toHaveBeenCalled()
  })
})

describe('createNewToken()', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should call ApiClient.createNewToken()', async () => {
    const createNewTokenSpy = jest
      .spyOn(ApiClient.prototype, 'createNewToken')
      .mockResolvedValue({} as NewToken)
    await createNewToken(testApiClient, 'description')
    expect(createNewTokenSpy).toHaveBeenCalled()
  })
})

describe('revokeNewToken()', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should call ApiClient.revokeNewToken()', async () => {
    const revokeNewTokenSpy = jest
      .spyOn(ApiClient.prototype, 'revokeNewToken')
      .mockResolvedValue()
    await revokeNewToken(testApiClient, '1')
    expect(revokeNewTokenSpy).toHaveBeenCalled()
  })
})
