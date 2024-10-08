import { BadRequestException } from '@nestjs/common'
import {
  validateBody,
  validateDate,
  validateId,
  validateName,
  validateFilter,
} from './input-validator'
import { z } from 'zod'

describe('validateId', () => {
  const postgresMaxId = 2147483647

  it.each([1, 2000, 0x500, '12', postgresMaxId])(
    'should accept valid values %s',
    (value) => {
      expect(() => validateId(value)).not.toThrow()
    },
  )

  it.each([
    undefined,
    null,
    '',
    '  \t\n',
    'text',
    '12why',
    'true',
    true,
    0,
    '0',
    -5,
    postgresMaxId + 1,
  ])('should throw a BadRequestException for invalid data %s', (value) => {
    expect(() => validateId(value)).toThrow(BadRequestException)
  })
})

describe('validateName', () => {
  it('should accept any string', () => {
    expect(() => validateName('Cool String')).not.toThrow()
  })

  it.each([undefined, null, '', '  \t\n', 5])(
    'should throw a BadRequestException on invalid data',
    (value) => {
      expect(() => validateName(value)).toThrow(BadRequestException)
    },
  )
})

describe('validateBody', () => {
  const testSchema = z
    .object({
      a: z.string().optional(),
      b: z.string().optional(),
      c: z.number().int(),
    })
    .strict()
    .refine((v) => v.a !== undefined || v.b !== undefined)

  it.each([
    { a: 'a', b: 'b', c: 1 },
    { a: 'a', c: 20 },
    { b: 'b', c: 1500 },
  ])('should accept valid values', (value) => {
    expect(() => validateBody(value, testSchema)).not.toThrow()
  })

  it.each([
    { a: 1, b: 'b', c: 2 },
    { a: null, b: '', c: 2 },
    { c: 2 },
    { a: 'a', c: 0.1 },
    { a: 'a', c: 'b' },
    { a: 'a' },
  ])('should throw a BadRequestException for invalid data', (value) => {
    expect(() => validateBody(value, testSchema)).toThrow(BadRequestException)
  })
})

describe('validateDatetime', () => {
  it.each([
    '1970-01-01',
    '1970-01-01 00:00:00Z',
    '1970-01-01T00:00:00Z',
    '1970-01-01T00:00:00+00:00',
    `${new Date().toISOString()}`,
    '2038-01-19T03:14:07Z',
    '2038-01-19T03:14:07+00:00',
  ])('should accept valid ISO datetime values %s', (value) => {
    expect(() => validateDate(value)).not.toThrowError()
  })

  it.each(['1970-01-01T00', 'invalidDatetime', '2038-01-19_03:14:07+00:00'])(
    'should throw an error for invalid ISO datetime %s',
    (value) => {
      expect(() => validateDate(value)).toThrowError()
    },
  )
})

describe('validateFilter', () => {
  it('should accept any string filter', () => {
    expect(() => validateFilter('Cool String')).not.toThrow()
  })

  it('should accept any string array filter', () => {
    expect(() => validateFilter(['Cool String', 'second'])).not.toThrow()
  })

  it.each([undefined, null, '', '  \t\n', 5, ['string', 1, false]])(
    'should throw a BadRequestException on invalid data',
    (value) => {
      expect(() => validateFilter(value)).toThrow(BadRequestException)
    },
  )
})
