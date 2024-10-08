import { jest } from '@jest/globals'
import { AssertionError } from 'assert'
import {
  consoleWarnYellow,
  failWithError,
  getFilenameFromUrl,
  getResourceDeletionConfirmation,
  handleRestApiError,
  handleStandardParams,
  logDownloadedFile,
  logResultAsJson,
  logSuccess,
  parseFilterOption,
  parseIntParameter,
  urlToApiUrl,
  validateUrl,
} from './common.js'
import { SpiedFunction } from 'jest-mock'
import chalk from 'chalk'
import inquirer from 'inquirer'

describe('Common functions of client lib', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Parse int parameter', () => {
    it('should parse an integer', () => {
      expect(parseIntParameter('103', 'dummy')).toBe(103)
    })

    it.each([
      undefined,
      null,
      '',
      ' \t\n',
      'x103.5',
      '103.5',
      '103..5',
      '45tv',
    ])('should throw errors on non integer input %s', (value: any) => {
      expect(() => parseIntParameter(value, 'dummy')).toThrow(AssertionError)
    })
  })

  describe('Log results', () => {
    it('should log json output', async () => {
      jest.spyOn(console, 'log')

      const content = {
        param1: 'Param1',
        param2: 'Param2',
      }
      const data = Promise.resolve(content)

      await logResultAsJson(data)

      expect(console.log).toBeCalledWith(JSON.stringify(content, null, 2))
    })

    it('should log the filename of a downloaded file', async () => {
      jest.spyOn(console, 'log')

      const data = Promise.resolve('evidences.zip')

      await logDownloadedFile(data)

      expect(console.log).toBeCalledWith('Wrote file evidences.zip')
    })

    it('should log a success message for if void promise resolves', async () => {
      jest.spyOn(console, 'log')

      const data = Promise.resolve()

      await logSuccess(data, 'Test Message')

      expect(console.log).toBeCalledWith('Test Message')
    })

    it.each([
      ['logResultAsJson', (promise: any) => logResultAsJson(promise)],
      ['logDownloadedFile', (promise: any) => logDownloadedFile(promise)],
      ['logSuccess', (promise: any) => logSuccess(promise, 'Test Message')],
    ])(
      'should throw an error for %s, if given promise rejects',
      async (name, testfct) => {
        jest.spyOn(console, 'log')

        const data = Promise.reject(new Error())
        await expect(testfct(data)).rejects.toThrow()

        expect(console.log).not.toBeCalled()
      }
    )
  })

  describe('Handle rest error', () => {
    it('should handle a rest api error', () => {
      const message = 'Test Error Message'
      const error = new Error(message)
      const restError = { status: 400, message, url: 'http://localhost/' }
      const mockExit = jest
        .spyOn(process, 'exit')
        .mockImplementation((number) => {
          throw error
        })
      jest.spyOn(console, 'log')
      expect(() => handleRestApiError(restError)).toThrow(error)
      expect(console.log).toBeCalledWith(
        `Error:\n` +
          `  Statuscode:    400\n` +
          `  Message:       ${message}\n` +
          `  Url:           ${restError.url}`
      )
      expect(mockExit).toBeCalledWith(1)
    })

    it('should handle an arbitrary error', () => {
      const message = 'Test Error Message'
      const error = new Error(message)
      const mockExit = jest
        .spyOn(process, 'exit')
        .mockImplementation((number) => {
          throw error
        })
      jest.spyOn(console, 'log')
      expect(() => handleRestApiError(error)).toThrow(error)
      expect(console.log).toBeCalledWith(
        `Error:\n` + `  Message:       ${message}`
      )
      expect(mockExit).toBeCalledWith(1)
    })
  })

  describe('Handle standard params', () => {
    it.each([
      ['all given', '45', 45],
      ['no id', '', 0],
    ])(
      'should parse values standard params %s',
      (name: string, id: string, result: number) => {
        const client: any = { baseUrl: 'Dummy', token: 'Dummy' }
        const namespace = 1
        expect(handleStandardParams(client, namespace, id, name)).toBe(result)
      }
    )

    it('should return 0 for not given id and name', () => {
      const client: any = { baseUrl: 'Dummy', token: 'Dummy' }
      const namespace = 1
      expect(handleStandardParams(client, namespace)).toBe(0)
      expect(handleStandardParams(client)).toBe(0)
    })

    it.each([
      ['no client', undefined, 1, '45'],
      ['no namespace', { baseUrl: 'Dummy', token: 'Dummy' }, undefined, '45'],
      ['no value', { baseUrl: 'Dummy', token: 'Dummy' }, 1, 'tk45'],
    ])(
      'should handle error case %s',
      (
        name: string,
        client: any,
        namespace: number | undefined,
        id: string
      ) => {
        expect(() => handleStandardParams(client, namespace, id, name)).toThrow(
          AssertionError
        )
      }
    )
  })

  describe('Handle parse filter options', () => {
    it.each([
      ['property=value1', 'property', ['value1']],
      ['property=value1,value2', 'property', ['value1', 'value2']],
      ['  property = value1, value2  ', 'property', ['value1', 'value2']],
      ['property=value1,,,value2', 'property', ['value1', 'value2']],
      ['', undefined, undefined],
      ['property', undefined, undefined],
      ['property=', undefined, undefined],
      ['property= , , ,  ', undefined, undefined],
      ['=value1', undefined, undefined],
    ])(
      'should parse a proper filter string "%s"',
      (
        filterString: string,
        expectedProperty: string | undefined,
        expectedValues: string[] | undefined
      ) => {
        expect(parseFilterOption(filterString)).toEqual({
          filterProperty: expectedProperty,
          filterValues: expectedValues,
        })
      }
    )
  })

  describe('getResourceDeletionConfirmation()', () => {
    it('should return the provided answer', async () => {
      const fun = jest
        .spyOn(inquirer, 'prompt')
        .mockImplementation((questions) => Promise.resolve({ continue: true }))

      const result = await getResourceDeletionConfirmation({})

      expect(result).toBe(true)

      fun.mockReset()
    })
  })

  describe('getFilenameFromUrl()', () => {
    it('should return the filename from url', () => {
      const urlText =
        'http://dot.com/api/v1/namespaces/1/configs/3/files/config.yaml'

      const result = getFilenameFromUrl(urlText)

      expect(result).toBe('config.yaml')
    })
    it('should return the last part of the url', () => {
      const urlText =
        'http://dot.com/api/v1/namespaces/1/configs/3/files/config'

      const result = getFilenameFromUrl(urlText)

      expect(result).toBe('config')
    })
    it('should return empty filename for urls ending in /', () => {
      const urlText = 'http://dot.com/x/'

      const result = getFilenameFromUrl(urlText)

      expect(result).toBe('')
    })
    it('should return empty filename for base urls', () => {
      const urlText = 'http://dot.com'

      const result = getFilenameFromUrl(urlText)

      expect(result).toBe('')
    })
    it('should fail when url is invalid', () => {
      const urlText = 'abcd'

      expect(() => {
        getFilenameFromUrl(urlText)
      }).toThrow(TypeError('Invalid URL'))
    })
  })

  describe('consoleWarnYellow()', () => {
    it('should print warning', () => {
      const consoleWarnSpy: SpiedFunction = jest.spyOn(console, 'warn')
      const warnText = 'test warning'

      consoleWarnYellow(warnText)

      expect(consoleWarnSpy).toHaveBeenCalledWith(chalk.yellow(warnText))

      jest.restoreAllMocks()
    })
  })

  describe('urlToApiUrl()', () => {
    it('should return the same url', () => {
      const urlText = 'http://dot.com/api/v1'

      const result = urlToApiUrl(urlText)

      expect(result).toBe(urlText)
    })
    it('should return formatted as api url', () => {
      const urlText = 'http://dot.com'

      const result = urlToApiUrl(urlText)

      expect(result).toBe(`${urlText}/api/v1`)
    })
  })

  describe('validateUrl()', () => {
    it('should return an url', () => {
      const urlText = 'http://dot.com'

      const result = validateUrl(urlText)

      expect(result).toBe(`${urlText}/`)
    })
    it('should fail to parse as url', () => {
      const urlText = 'abcd'
      expect(() => {
        validateUrl(urlText)
      }).toThrow(TypeError('Invalid URL'))
    })
  })

  describe('failWithError()', () => {
    let consoleErrorSpy: SpiedFunction
    beforeEach(() => {
      jest.spyOn(process, 'exit').mockImplementation((number) => {
        throw new Error('process.exit: ' + number)
      })
      consoleErrorSpy = jest.spyOn(console, 'error')
    })
    afterEach(() => {
      jest.restoreAllMocks()
    })
    it('should print error and exit', () => {
      let message: any
      const errorText = 'test error'

      try {
        failWithError(errorText)
      } catch (e) {
        // make sure the error comes from our mocked process.exit(1)
        if (e instanceof Error) {
          message = e.message
        }
      }

      expect(message).toBe('process.exit: 1')

      expect(consoleErrorSpy).toHaveBeenCalledWith(chalk.red(errorText))
    })
  })
})
