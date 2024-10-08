import {
  DEFAULT_EXPONENTIAL_BASE_FOR_RETRIES,
  DEFAULT_MAXIMUM_RETRY_COUNT_FOR_RATE_LIMIT_RETRIES,
  RestApiRequestError,
  calculateWaitingTime,
  executeRestCall,
  getRateLimitFromResponse,
  retryLimitReached,
} from './call-wrapper.js'
import * as utils from './utils'
import ClientConfig from './client-config'
import { YakuClientConfig } from './types.js'

const url = 'testurl'
const errorMessage = 'Error Message'

const yakuClientConfig: YakuClientConfig = {
  baseUrl: 'baseUrl',
  token: 'token',
}

afterEach(() => {
  jest.restoreAllMocks()
  jest.clearAllMocks()
})

describe('executeRestCall()', () => {
  it('should return a result for an successful rest call', async () => {
    const body = { data: 'TestData' }
    const response: any = {
      ok: true,
      status: 200,
      url,
      statusText: 'Ok',
      json: () => {
        return body
      },
    }

    jest.spyOn(ClientConfig, 'getConfig').mockReturnValue(yakuClientConfig)

    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockImplementation(jest.fn(() => Promise.resolve(response)) as jest.Mock)

    const config = {
      method: 'GET',
      headers: { Content_Type: 'application/json' },
    }
    const result = await executeRestCall(url, config)

    expect(result.ok).toBeTruthy()
    expect(result.json()).toBe(body)
    expect(fetchSpy).toBeCalledWith(url, config)
  })

  it('should return ok for an updating request', async () => {
    const body = { data: 'TestData' }
    const response: any = {
      ok: true,
      status: 200,
      url,
      statusText: 'Ok',
    }

    jest.spyOn(ClientConfig, 'getConfig').mockReturnValue(yakuClientConfig)

    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockImplementation(jest.fn(() => Promise.resolve(response)) as jest.Mock)

    const config = {
      method: 'POST',
      headers: { Content_Type: 'application/json' },
      body,
    }
    const result = await executeRestCall(url, config)

    expect(result.ok).toBeTruthy()
    expect(fetchSpy).toBeCalledWith(url, config)
  })

  it('should throw a RestApiRequestError if response is not ok', async () => {
    const response: any = {
      ok: false,
      json: () => {
        return {
          message: errorMessage,
          statusCode: 400,
        }
      },
    }

    jest.spyOn(ClientConfig, 'getConfig').mockReturnValue(yakuClientConfig)

    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockImplementation(jest.fn(() => Promise.resolve(response)) as jest.Mock)

    const config = {
      method: 'GET',
      headers: { Content_Type: 'application/json' },
    }

    try {
      await executeRestCall(url, config)
      fail()
    } catch (err) {
      if (err instanceof RestApiRequestError) {
        expect(err.status).toBe(400)
        expect(err.message).toBe(errorMessage)
      } else {
        throw err
      }
    }

    expect(fetchSpy).toBeCalledWith(url, config)
  })

  it('should wait and retry when hitting a rate limit error', async () => {
    const body = { data: 'TestData' }
    const normalResponse: any = {
      ok: true,
      status: 200,
      url,
      statusText: 'Ok',
      json: () => {
        return body
      },
    }
    const rateLimitErrorResponse: any = {
      ok: false,
      status: 429,
      url,
      statusText: 'Rate Limit reached',
    }

    jest.spyOn(ClientConfig, 'getConfig').mockReturnValue(yakuClientConfig)
    jest.spyOn(console, 'warn').mockImplementation()
    jest.spyOn(utils, 'wait').mockResolvedValue(undefined)

    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockImplementation(
        jest.fn(() => Promise.resolve(normalResponse)) as jest.Mock
      )
      .mockResolvedValue(normalResponse)
      .mockResolvedValueOnce(rateLimitErrorResponse)
      .mockResolvedValueOnce(rateLimitErrorResponse)
      .mockResolvedValueOnce(rateLimitErrorResponse)
      .mockResolvedValueOnce(rateLimitErrorResponse)

    const config = {
      method: 'GET',
      headers: { Content_Type: 'application/json' },
    }

    const result = await executeRestCall(url, config)

    expect(result.ok).toBeTruthy()
    expect(result.status).toEqual(200)
    expect(fetchSpy).toHaveBeenLastCalledWith(url, config)

    for (let n = 1; n < 5; n++) {
      expect(utils.wait).toHaveBeenNthCalledWith(
        n,
        Math.pow(DEFAULT_EXPONENTIAL_BASE_FOR_RETRIES, n - 1)
      )
    }
    expect(utils.wait).toBeCalledTimes(4)
  })

  it('should not wait too long for rate limit errors', async () => {
    const rateLimitErrorResponse: any = {
      ok: false,
      status: 429,
      url,
      statusText: 'Rate Limit reached',
      json: () => {
        return {}
      },
    }

    jest.spyOn(ClientConfig, 'getConfig').mockReturnValue(yakuClientConfig)
    jest.spyOn(console, 'warn').mockImplementation()
    jest.spyOn(utils, 'wait').mockResolvedValue(undefined)

    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockImplementation(
        jest.fn(() => Promise.resolve(rateLimitErrorResponse)) as jest.Mock
      )

    const config = {
      method: 'GET',
      headers: { Content_Type: 'application/json' },
    }

    try {
      await executeRestCall(url, config, { maxWaitingTime: 1000 })
      fail()
    } catch (err) {
      if (err instanceof Error) {
        expect(err.message).toBe(
          'Rate limit reached! Waited for 113s but server still responds with 429 Rate Limit reached.'
        )
      } else {
        throw err
      }
    }

    expect(utils.wait).toBeCalledTimes(
      DEFAULT_MAXIMUM_RETRY_COUNT_FOR_RATE_LIMIT_RETRIES
    )
  })

  it('should wait the given time if a ratelimit-reset header is provided', async () => {
    const rateLimitResetTime = 10 // seconds
    const body = { data: 'TestData' }
    const normalResponse: any = {
      ok: true,
      status: 200,
      url,
      statusText: 'Ok',
      json: () => {
        return body
      },
    }
    const rateLimitErrorResponse: any = {
      ok: false,
      status: 429,
      url,
      statusText: 'Rate Limit reached',
      headers: new Headers({ 'ratelimit-reset': String(rateLimitResetTime) }),
    }

    jest.spyOn(ClientConfig, 'getConfig').mockReturnValue(yakuClientConfig)
    jest.spyOn(console, 'warn').mockImplementation()
    jest.spyOn(utils, 'wait').mockResolvedValue(undefined)

    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockImplementation(
        jest.fn(() => Promise.resolve(normalResponse)) as jest.Mock
      )
      .mockResolvedValueOnce(rateLimitErrorResponse)

    const config = {
      method: 'GET',
      headers: { Content_Type: 'application/json' },
    }

    const result = await executeRestCall(url, config)

    expect(result.ok).toBeTruthy()
    expect(result.status).toEqual(200)
    expect(fetchSpy).toHaveBeenLastCalledWith(url, config)

    expect(utils.wait).toHaveBeenCalledWith(10)
    expect(utils.wait).toBeCalledTimes(1)
  })

  it('should throw a normal error, if fetch returns with an error', async () => {
    const config = {
      method: 'GET',
      headers: { Content_Type: 'application/json' },
    }

    jest.spyOn(ClientConfig, 'getConfig').mockReturnValue(yakuClientConfig)

    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockImplementation(
        jest.fn(() => Promise.reject(new Error('fetch failed'))) as jest.Mock
      )

    try {
      await executeRestCall(url, config)
      fail()
    } catch (err) {
      if (err instanceof Error) {
        expect(err.message).toBe(`Cannot access ${url}\nfetch failed`)
      } else {
        throw err
      }
    }

    expect(fetchSpy).toBeCalledWith(url, config)
  })

  it('should throw an error if JSON response cannot be decoded', async () => {
    const response: any = {
      ok: false,
      status: 500,
      url,
      statusText: 'Some strange error for debugging',
      body: '<html>',
      json: async () => {
        throw new Error('Cannot decode JSON')
      },
    }

    jest.spyOn(ClientConfig, 'getConfig').mockReturnValue(yakuClientConfig)

    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockImplementation(jest.fn(() => Promise.resolve(response)) as jest.Mock)

    const config = {
      method: 'GET',
      headers: { Content_Type: 'application/json' },
    }

    try {
      await executeRestCall(url, config)
      fail()
    } catch (err) {
      if (err instanceof Error) {
        expect(err.message).toBe(
          `Could not decode HTTP error response (${response.status} ${response.statusText}) into a JSON object: ${response.body}.`
        )
      } else {
        throw err
      }
    }
  })
})

describe('retryLimitReached()', () => {
  it('should always return false if no limits are set', () => {
    expect(
      retryLimitReached({
        maxWaitingTime: 0,
        retryLimit: 0,
        currentRetryCount: 42,
        exponentialBase: 2,
        passedTime: 42,
      })
    ).toBe(false)
  })

  it('should return true if retry count is equal to or larger than limit', () => {
    expect(
      retryLimitReached({
        maxWaitingTime: 0,
        retryLimit: 5,
        currentRetryCount: 5,
        exponentialBase: 2,
        passedTime: 42,
      })
    ).toBe(true)

    expect(
      retryLimitReached({
        maxWaitingTime: 0,
        retryLimit: 5,
        currentRetryCount: 6,
        exponentialBase: 2,
        passedTime: 42,
      })
    ).toBe(true)
  })

  it('should return true if waiting time is equal to or larger than limit', () => {
    expect(
      retryLimitReached({
        maxWaitingTime: 1,
        retryLimit: 0,
        currentRetryCount: 42,
        exponentialBase: 2,
        passedTime: 1,
      })
    ).toBe(true)

    expect(
      retryLimitReached({
        maxWaitingTime: 1,
        retryLimit: 0,
        currentRetryCount: 42,
        exponentialBase: 2,
        passedTime: 2,
      })
    ).toBe(true)
  })
})

describe('calculateWaitingTime()', () => {
  it('should calculate waiting time from header', () => {
    const mockResponse = new Response()
    jest.spyOn(mockResponse.headers, 'get').mockImplementation(() => '37')

    expect(
      calculateWaitingTime(mockResponse, {
        currentRetryCount: 0,
        exponentialBase: 2,
        maxWaitingTime: 0,
        passedTime: 0,
        retryLimit: 0,
      })
    ).toEqual(37)
  })
  it('should use exponentially growing waiting time if no header is set', () => {
    const mockResponse = new Response()
    const base = 2

    for (let counter = 1; counter < 3; counter++) {
      expect(
        calculateWaitingTime(mockResponse, {
          currentRetryCount: counter,
          exponentialBase: base,
          maxWaitingTime: 0,
          passedTime: 0,
          retryLimit: 0,
        })
      ).toEqual(Math.pow(base, counter))
    }
  })
  it('should not wait longer than waiting time limit', () => {
    const mockResponse = new Response()
    const base = 2
    expect(
      calculateWaitingTime(mockResponse, {
        currentRetryCount: 10,
        exponentialBase: base,
        maxWaitingTime: 1000, // 2^10 would be 1024 and larger than 1000
        passedTime: 0,
        retryLimit: 0,
      })
    ).toEqual(1000)
  })
})

describe('getRateLimitFromResponse()', () => {
  it('should return rate limit as number from header', () => {
    const mockResponse = new Response()
    jest.spyOn(mockResponse.headers, 'get').mockImplementation(() => '42')
    expect(getRateLimitFromResponse(mockResponse)).toEqual(42)
  })
  it('should return undefined if no header is set', () => {
    const mockResponse = new Response()
    expect(getRateLimitFromResponse(mockResponse)).toBeUndefined()
  })
  it('should return undefined if number in header cannot be parsed', () => {
    const mockResponse = new Response()
    jest
      .spyOn(mockResponse.headers, 'get')
      .mockImplementation(() => '42 seconds')
    expect(getRateLimitFromResponse(mockResponse)).toEqual(42)
  })
})
