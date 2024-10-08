import ClientConfig from './client-config.js'
import { wait } from './utils.js'

const DEFAULT_WAITING_TIME_FOR_RATE_LIMIT_RETRIES_IN_SECONDS = 60
export const DEFAULT_MAXIMUM_RETRY_COUNT_FOR_RATE_LIMIT_RETRIES = 10
export const DEFAULT_EXPONENTIAL_BASE_FOR_RETRIES = 1.5

export class RestApiRequestError extends Error {
  __proto__ = Error

  status: number
  message: string;

  [key: string]: any

  constructor(e: {
    message: string
    status: number
    additionalProperties?: { [key: string]: any }
  }) {
    super(e.message)
    this.message = e.message
    this.status = e.status
    this.url = e.additionalProperties?.url ?? ''
    this.body = e.additionalProperties?.body ?? ''
    this.headers = e.additionalProperties?.headers
    this.cause = e.additionalProperties?.cause
    Object.setPrototypeOf(this, RestApiRequestError.prototype)
  }
}

export type RequestConfig = {
  method: string
  headers: any
  body?: any
}

export type RetryConfig = {
  passedTime: number
  currentRetryCount: number
  retryLimit: number
  maxWaitingTime: number
  exponentialBase: number
}

function getRetryOptionsWithDefaults(
  retryConfig?: Partial<RetryConfig>
): RetryConfig {
  retryConfig = retryConfig || {}
  // retryLimit might be 0, so we have to explicitly check for undefined here!
  if (retryConfig.retryLimit == undefined) {
    retryConfig.retryLimit = DEFAULT_MAXIMUM_RETRY_COUNT_FOR_RATE_LIMIT_RETRIES
  }
  // maxWaitingTime might be 0, so we have to explicitly check for undefined here!
  if (retryConfig.maxWaitingTime == undefined) {
    retryConfig.maxWaitingTime =
      DEFAULT_WAITING_TIME_FOR_RATE_LIMIT_RETRIES_IN_SECONDS
  }
  retryConfig.exponentialBase =
    retryConfig.exponentialBase || DEFAULT_EXPONENTIAL_BASE_FOR_RETRIES
  retryConfig.currentRetryCount = retryConfig.currentRetryCount || 0
  retryConfig.passedTime = retryConfig.passedTime || 0
  return retryConfig as RetryConfig
}

export function retryLimitReached(options: RetryConfig): boolean {
  return (
    (options.retryLimit != 0 &&
      options.currentRetryCount >= options.retryLimit) ||
    (options.maxWaitingTime != 0 &&
      options.passedTime >= options.maxWaitingTime)
  )
}

export function calculateWaitingTime(
  response: Response,
  options: RetryConfig
): number {
  let waitingTime
  if (response.headers && response.headers.get('ratelimit-reset')) {
    waitingTime = Number.parseInt(
      response.headers.get('ratelimit-reset') || '0'
    )
  } else {
    waitingTime = Math.pow(options.exponentialBase, options.currentRetryCount)
  }
  if (options.maxWaitingTime != 0) {
    return Math.min(waitingTime, options.maxWaitingTime)
  } else {
    return waitingTime
  }
}

export function getRateLimitFromResponse(
  response: Response
): number | undefined {
  if (response.headers && response.headers.get('ratelimit-limit')) {
    return Number.parseInt(response.headers.get('ratelimit-limit') || '0')
  }
}

export const executeRestCall = async (
  url: string,
  config: RequestConfig,
  retryOptions?: Partial<RetryConfig>
): Promise<any> => {
  const yakuClientConfig = ClientConfig.getConfig()
  if (!yakuClientConfig) {
    throw new Error('Client config not yet initialized.')
  }

  const dispatcher = {
    dispatcher: yakuClientConfig.agent,
  }

  let response: any
  try {
    response = (await fetch(url, { ...config, ...dispatcher })) as any
  } catch (err: any) {
    err.message = `Cannot access ${url}\n${err.message}`
    throw err
  }

  if (!response.ok) {
    // process rate limit error
    if (response.status == 429) {
      return await retryOnRateLimitError(url, config, retryOptions, response)
    }

    // process other errors
    let r: any
    try {
      r = await response.json()
    } catch (error) {
      throw new Error(
        `Could not decode HTTP error response (${response.status} ${response.statusText}) into a JSON object: ${response.body}.`
      )
    }
    throw new RestApiRequestError({
      status: r.statusCode,
      message: r.message,
      additionalProperties: {
        url: url,
        body: config.body,
        headers: response.headers,
      },
    })
  }
  return response
}

async function retryOnRateLimitError(
  url: string,
  config: RequestConfig,
  retryOptions: Partial<RetryConfig> | undefined,
  response: Response
) {
  const fullRetryOptions = getRetryOptionsWithDefaults(retryOptions)

  if (retryLimitReached(fullRetryOptions)) {
    throw new Error(
      `Rate limit reached! Waited for ${Math.round(
        fullRetryOptions.passedTime
      )}s but server still responds with ${response.status} ${
        response.statusText
      }.`
    )
  }

  const waitingTime = calculateWaitingTime(response, fullRetryOptions)
  const rateLimit = getRateLimitFromResponse(response)
  if (rateLimit !== undefined) {
    console.warn(
      `Rate limit reached (${rateLimit}/s). Retrying in ${waitingTime.toFixed(
        2
      )} seconds.`
    )
  } else {
    console.warn(
      `Rate limit reached. Retrying in ${waitingTime.toFixed(2)} seconds.`
    )
  }
  await wait(waitingTime)

  fullRetryOptions.currentRetryCount += 1
  fullRetryOptions.passedTime += waitingTime

  return await executeRestCall(url, config, fullRetryOptions)
}
