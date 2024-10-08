import { Logger } from 'nestjs-pino'
import { Observable, of } from 'rxjs'
import { PinoLoggingInterceptor } from './pino-logging-interceptor'

describe('Pino logging interceptor', () => {
  type Mutable<T> = {
    -readonly [k in keyof T]: T[k]
  }

  const method = 'PATCH'
  const originalUrl = 'http://localdev.me:3000/something'
  const userId = 'test'
  const traceId = 1
  const statusCode = 200
  const delay = 100

  const context: any = {
    getArgs: () => [
      {
        user: {
          username: userId,
        },
        id: traceId,
      },
    ],
    switchToHttp: () => ({
      getRequest: () => ({
        method,
        originalUrl,
      }),
      getResponse: () => ({
        statusCode,
      }),
    }),
  }

  const testee = new PinoLoggingInterceptor()
  let logger: Logger

  beforeEach(() => {
    const mTestee = testee as Mutable<PinoLoggingInterceptor>
    mTestee['logger'] = jest.mock('nestjs-pino')
    logger = mTestee['logger']
    logger.debug = jest.fn().mockImplementation()
  })

  it('should log the execution properly', async () => {
    jest.useFakeTimers()

    const result = await testee.intercept(context, {
      handle: (): Observable<any> => {
        jest.advanceTimersByTime(delay)
        return of(true)
      },
    })

    result.forEach((value) => value)
    expect(logger.debug).toBeCalledTimes(2)
    expect(logger.debug).toHaveBeenNthCalledWith(1, {
      method: 'PATCH',
      path: 'http://localdev.me:3000/something',
      traceId: 1,
      userId: 'test',
    })
    expect(logger.debug).toHaveBeenNthCalledWith(2, {
      method: 'PATCH',
      path: 'http://localdev.me:3000/something',
      status: 200,
      traceId: 1,
      userId: 'test',
    })
    jest.useRealTimers()
  })
})
