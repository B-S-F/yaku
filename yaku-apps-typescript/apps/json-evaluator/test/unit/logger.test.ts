import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { Logger } from '../../src/logger'

describe('Logger', async () => {
  let logger: Logger

  beforeEach(() => {
    logger = new Logger()
  })

  afterEach(() => {
    logger.restore()
  })

  it('should write to the log stream', async () => {
    expect(() => logger.writeToStream('This is a test.')).not.toThrowError()
    logger.end()
    expect(logger.getLogString()).resolves.toBe('This is a test.')
  })

  it('should restore stdout', () => {
    expect(() => logger.restore()).not.toThrowError()
  })

  it('should return the string written to the log stream', async () => {
    logger.writeToStream('This is a test.')
    logger.end()
    expect(logger.getLogString()).resolves.toBe('This is a test.')
  })

  it('should remove color codes from the log string', async () => {
    const testString = '\u001b[32mThis is a test.\u001b[39m'
    logger.writeToStream(testString)
    logger.end()
    expect(logger.getLogString()).resolves.toBe('This is a test.')
  })

  it('should make urls clickable in the log string', async () => {
    const testString = 'This is a url: http://example.com'
    logger.writeToStream(testString)
    logger.end()
    expect(logger.getLogString()).resolves.toBe(
      'This is a url: [http://example.com](http://example.com)',
    )
  })
})
