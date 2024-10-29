import { BadRequestException } from '@nestjs/common'
import { SelectQueryBuilder } from 'typeorm'

export class EntityList<T> {
  itemCount: number
  entities: T[]
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export type FilterOption = {
  readonly property: string
  readonly values: string[]
}

export function parseFilter(filter: string[] | string): FilterOption[] {
  if (!filter) {
    return undefined
  }
  let filterToUse = []
  if (!Array.isArray(filter)) {
    filterToUse = filter.split('&')
  } else filterToUse = filter

  const filterData: FilterOption[] = []
  for (const current of filterToUse) {
    const filterExpression = current.trim()
    const splittedFilterExpression = filterExpression.split('=')
    if (splittedFilterExpression.length !== 2) {
      throw new BadRequestException(
        `Could not parse the given filter parameter, it does not follow the pattern 'property = value': ${filterExpression}`,
      )
    }
    const property = splittedFilterExpression[0].trim()
    const rawValues = splittedFilterExpression[1].trim()
    const values = rawValues
      .split(',')
      .map((value) => value.trim())
      .filter((value) => Boolean(value))
    if (values.length === 0) {
      throw new BadRequestException(
        `Could not parse the given filter parameter, it does not contain values to filter for: ${filterExpression}`,
      )
    }
    filterData.push({ property, values })
  }
  return filterData
}

export class ListQueryHandler {
  additionalParams: { [key: string]: any } = {}

  constructor(
    readonly page: number,
    readonly items: number,
    readonly sortOrder: SortOrder,
    readonly sortBy: string,
  ) {}

  addToQueryBuilder<T>(
    queryBuilder: SelectQueryBuilder<T>,
    itemName: string,
  ): void {
    queryBuilder
      .orderBy(`${itemName}.${this.sortBy}`, this.sortOrder)
      .skip((this.page - 1) * this.items)
      .take(this.items)
  }
}
