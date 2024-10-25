import { BadRequestException } from '@nestjs/common'
import { ZodSchema, z } from 'zod'
import { fromZodError } from 'zod-validation-error'

const maxIdPostgresSerial4 = 2147483647

const numberSchema = z.number().int().positive().max(maxIdPostgresSerial4)
const stringSchema = z.string().trim().min(1)

const dateSchema = z.coerce.date()

export function validateId(receivedId: any): void {
  try {
    if (typeof receivedId === 'boolean') {
      receivedId = 0
    }
    const id = Number(receivedId)
    numberSchema.parse(id)
  } catch (err) {
    throw new BadRequestException(fromZodError(err).message, {
      cause: err,
    })
  }
}

export function validateName(receivedName: any): void {
  try {
    stringSchema.parse(receivedName)
  } catch (err) {
    throw new BadRequestException(fromZodError(err).message, {
      cause: err,
    })
  }
}

export function validateBody(body: any, schema: ZodSchema): void {
  try {
    schema.parse(body)
  } catch (err) {
    throw new BadRequestException(fromZodError(err).message, {
      cause: err,
    })
  }
}

export function validateDate(receivedDatetime: any) {
  try {
    dateSchema.parse(receivedDatetime)
  } catch (error) {
    throw new BadRequestException(fromZodError(error).message, {
      cause: error,
    })
  }
}

export function validateFilter(receivedFilter: any) {
  try {
    if (Array.isArray(receivedFilter)) {
      receivedFilter.every((elem) => {
        return stringSchema.parse(elem)
      })
    } else {
      stringSchema.parse(receivedFilter)
    }
  } catch (error) {
    throw new BadRequestException(fromZodError(error).message, {
      cause: error,
    })
  }
}
