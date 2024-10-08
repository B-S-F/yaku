import { Logger } from 'nestjs-pino'
import { TypeOrmToNestLogger } from './typeorm-logger'

describe('TypeOrmToNestLogger', () => {
  const logger = new TypeOrmToNestLogger()
  let iLogger: Logger
  let logMessage: string

  const testMessage = 'Some strange data'
  const testParams = ['Param1', 'ParamSomething']

  beforeEach(() => {
    iLogger = logger['logger']
    iLogger.debug = jest.fn()
    iLogger.verbose = jest.fn()
    iLogger.log = jest.fn()
    iLogger.warn = jest.fn()
    iLogger.error = jest.fn()
  })

  it('should log queries properly', () => {
    logger['logQueries'] = true
    jest.spyOn(iLogger, 'debug').mockImplementation((message: string) => {
      logMessage = message
    })

    logger.logQuery(testMessage, testParams)
    logger['logQueries'] = false

    expect(logMessage['msg']).toContain(testMessage)
    expect(logMessage['msg']).toContain(testParams[0])
    expect(logMessage['msg']).toContain(testParams[1])
  })

  it('should log query errors with error properly', () => {
    jest.spyOn(iLogger, 'warn').mockImplementation((message: string) => {
      logMessage = message
    })

    const err = new Error('Some Error')
    logger.logQueryError(err, testMessage, testParams)

    expect(logMessage['msg']).toContain(err.message)
    expect(logMessage['msg']).toContain(testMessage)
    expect(logMessage['msg']).toContain(testParams[0])
    expect(logMessage['msg']).toContain(testParams[1])
  })

  it('should log query errors with string properly', () => {
    jest.spyOn(iLogger, 'warn').mockImplementation((message: string) => {
      logMessage = message
    })

    const err = 'Some Error'
    logger.logQueryError(err, testMessage, testParams)

    expect(logMessage['msg']).toContain(err)
    expect(logMessage['msg']).toContain(testMessage)
    expect(logMessage['msg']).toContain(testParams[0])
    expect(logMessage['msg']).toContain(testParams[1])
  })

  it('should log long running queries properly', () => {
    jest.spyOn(iLogger, 'log').mockImplementation((message: string) => {
      logMessage = message
    })

    const duration = 1000

    logger.logQuerySlow(duration, testMessage, testParams)

    expect(logMessage['msg']).toContain(duration.toString())
    expect(logMessage['msg']).toContain(testMessage)
    expect(logMessage['msg']).toContain(testParams[0])
    expect(logMessage['msg']).toContain(testParams[1])
  })

  it('should log schema build properly', () => {
    jest.spyOn(iLogger, 'debug').mockImplementation((message: string) => {
      logMessage = message
    })

    logger.logSchemaBuild(testMessage)

    expect(logMessage['msg']).toContain(testMessage)
  })

  it('should log migrations properly', () => {
    jest.spyOn(iLogger, 'debug').mockImplementation((message: string) => {
      logMessage = message
    })

    logger.logMigration(testMessage)

    expect(logMessage['msg']).toContain(testMessage)
  })

  it('should log warn properly', () => {
    jest.spyOn(iLogger, 'warn').mockImplementation((message: string) => {
      logMessage = message
    })

    logger.log('warn', testMessage)

    expect(logMessage['msg']).toContain(testMessage)
  })

  it('should log info properly', () => {
    jest.spyOn(iLogger, 'log').mockImplementation((message: string) => {
      logMessage = message
    })

    logger.log('info', testMessage)

    expect(logMessage['msg']).toContain(testMessage)
  })

  it('should log normal log level properly', () => {
    jest.spyOn(iLogger, 'log').mockImplementation((message: string) => {
      logMessage = message
    })

    logger.log('info', testMessage)

    expect(logMessage['msg']).toContain(testMessage)
  })
})
