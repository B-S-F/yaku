import { jest } from '@jest/globals'
import { loginOAuth, OAuthClient, refreshOAuth, _t } from './oauth'
import { Environment } from './handlers/environment'

// private functions to test
const { generateCodeVerifier, base64URLEncode } = _t

const testLoginResponse = {
  accessToken: 'at',
  refreshToken: 'rt',
}
const envName = 'envName'
const url = 'http://dot.com'

describe('loginOAuth()', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should call OauthClient.connect() and OauthClient.login()', async () => {
    const connectSpy = jest
      .spyOn(OAuthClient.prototype, 'connect')
      .mockResolvedValue()
    const loginSpy = jest
      .spyOn(OAuthClient.prototype, 'login')
      .mockResolvedValue(testLoginResponse)

    await expect(loginOAuth(envName, url, [])).resolves.toEqual({
      name: envName,
      url: url,
      accessToken: testLoginResponse.accessToken,
      refreshToken: testLoginResponse.refreshToken,
      current: true,
    })
    expect(connectSpy).toHaveBeenCalled()
    expect(loginSpy).toHaveBeenCalled()
  })
})

describe('refreshOAuth()', () => {
  let connectSpy: any
  let loginSpy: any
  beforeEach(() => {
    connectSpy = jest
      .spyOn(OAuthClient.prototype, 'connect')
      .mockResolvedValue()
    loginSpy = jest
      .spyOn(OAuthClient.prototype, 'login')
      .mockResolvedValue(testLoginResponse)
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should call OauthClient.connect() and OauthClient.refresh()', async () => {
    const refreshSpy = jest
      .spyOn(OAuthClient.prototype, 'refresh')
      .mockResolvedValue(testLoginResponse)

    await expect(
      refreshOAuth({
        name: envName,
        url: url,
        refreshToken: testLoginResponse.refreshToken,
      } as Environment)
    ).resolves.toEqual({
      name: envName,
      url: url,
      accessToken: testLoginResponse.accessToken,
      refreshToken: testLoginResponse.refreshToken,
    })
    expect(connectSpy).toHaveBeenCalled()
    expect(refreshSpy).toHaveBeenCalled()
    expect(loginSpy).not.toHaveBeenCalled()
  })
  it('should call OauthClient.connect() and OauthClient.login() when OauthClient.refresh() fails', async () => {
    const refreshSpy = jest
      .spyOn(OAuthClient.prototype, 'refresh')
      .mockRejectedValue(Error('<insert fail reason here>'))

    await expect(
      refreshOAuth({
        name: envName,
        url: url,
        refreshToken: testLoginResponse.refreshToken,
      } as Environment)
    ).resolves.toEqual({
      name: envName,
      url: url,
      accessToken: testLoginResponse.accessToken,
      refreshToken: testLoginResponse.refreshToken,
    })
    expect(connectSpy).toHaveBeenCalled()
    expect(refreshSpy).toHaveBeenCalled()
    expect(loginSpy).toHaveBeenCalled()
  })
})

describe('generateCodeVerifier()', () => {
  it('should generate different codes', () => {
    expect(generateCodeVerifier()).not.toBe(generateCodeVerifier())
  })
})

describe('base64URLEncode()', () => {
  it('should escape special characters', () => {
    expect(base64URLEncode(new Buffer('+/=\0'))).toBe('Ky89AA')
  })
})
