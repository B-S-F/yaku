import { BadRequestException } from '@nestjs/common'
import { randomInt } from 'crypto'
import { SelectQueryBuilder } from 'typeorm'
import {
  createPaginationData,
  PaginatedData,
  PaginationQueryOptions,
  queryOptionsSchema,
  toListQueryOptions,
} from './query-param-handling-controller'
import {
  ListQueryHandler,
  parseFilter,
  SortOrder,
} from './query-param-handling-service'
import {
  createMockResponse,
  namespaceUrl,
  testingNamespaceId,
} from './test-services'
import { UrlHandler } from './url-handler'

describe('Query Param Handling', () => {
  const url = `/api/v1/namespaces/${testingNamespaceId}`

  function createListQueryHandler(sourceObj: {
    page?: number | string
    items?: number | string
    sortOrder?: string
    sortBy?: string
  }) {
    return toListQueryOptions(
      sourceObj as PaginationQueryOptions,
      queryOptionsSchema,
      ['column'],
      'id',
    )
  }

  it('should parse list fully defined query options properly', () => {
    const queryOptions = createListQueryHandler({
      page: 5,
      items: 10,
      sortOrder: SortOrder.ASC,
      sortBy: 'column',
    })

    expect(queryOptions.page).toBe(5)
    expect(queryOptions.items).toBe(10)
    expect(queryOptions.sortOrder).toBe(SortOrder.ASC)
    expect(queryOptions.sortBy).toBe('column')
  })

  it('should parse list query options with string page and item', () => {
    const queryOptions = createListQueryHandler({
      page: '5',
      items: '10',
      sortOrder: SortOrder.ASC,
      sortBy: 'column',
    })

    expect(queryOptions.page).toBe(5)
    expect(queryOptions.items).toBe(10)
    expect(queryOptions.sortOrder).toBe(SortOrder.ASC)
    expect(queryOptions.sortBy).toBe('column')
  })

  it('should parse empty query options and return defaults', () => {
    const queryOptions = createListQueryHandler({})

    expect(queryOptions.page).toBe(1)
    expect(queryOptions.items).toBe(20)
    expect(queryOptions.sortOrder).toBe(SortOrder.DESC)
    expect(queryOptions.sortBy).toBe('id')
  })

  it('should parse partial query options and return defaults for the missing', () => {
    const queryOptions = createListQueryHandler({
      page: 5,
    })

    expect(queryOptions.page).toBe(5)
    expect(queryOptions.items).toBe(20)
    expect(queryOptions.sortOrder).toBe(SortOrder.DESC)
    expect(queryOptions.sortBy).toBe('id')
  })

  it('should catch unknown query option', () => {
    const brokenQueryOption: any = { filter2: 'property: value1' }
    expect(() =>
      toListQueryOptions(
        brokenQueryOption,
        queryOptionsSchema.strict(),
        [],
        'id',
      ),
    ).toThrow(BadRequestException)
  })

  it('should catch non number page parameter', () => {
    const brokenQueryOption: any = { page: '1t' }
    expect(() =>
      toListQueryOptions(
        brokenQueryOption,
        queryOptionsSchema.strict(),
        [],
        'id',
      ),
    ).toThrow(BadRequestException)
  })

  it('should catch a wrong sort order', () => {
    const brokenQueryOption: any = { sortOrder: 'Ascending' }
    expect(() =>
      toListQueryOptions(
        brokenQueryOption,
        queryOptionsSchema.strict(),
        [],
        'id',
      ),
    ).toThrow(BadRequestException)
  })

  it('should handle whitespace in filter correctly', () => {
    const filterOptions = parseFilter(' property = value1 , value2 ')

    expect(filterOptions.length).toBe(1)
    expect(filterOptions[0].property).toBe('property')
    expect(filterOptions[0].values).toStrictEqual(['value1', 'value2'])
  })

  it('should parse multiple filter options correctly', () => {
    const filterOptions = parseFilter([
      'property1=value1',
      ' property2 = value2',
    ])

    expect(filterOptions.length).toBe(2)
    expect(filterOptions[0].property).toBe('property1')
    expect(filterOptions[0].values).toStrictEqual(['value1'])
    expect(filterOptions[1].property).toBe('property2')
    expect(filterOptions[1].values).toStrictEqual(['value2'])
  })

  it('should parse multiple filter options correctly in second format', () => {
    const filterOptions = parseFilter(
      'property1=value1,value2 &property2 = value3',
    )

    expect(filterOptions.length).toBe(2)
    expect(filterOptions[0].property).toBe('property1')
    expect(filterOptions[0].values).toStrictEqual(['value1', 'value2'])
    expect(filterOptions[1].property).toBe('property2')
    expect(filterOptions[1].values).toStrictEqual(['value3'])
  })

  it('should handle corner cases of filtering properly', () => {
    expect(() => parseFilter('property[value1,value2]')).toThrow(
      BadRequestException,
    )
    expect(() => parseFilter('property=,')).toThrow(BadRequestException)

    let filterOptions = parseFilter('property=,value2')
    expect(filterOptions[0].values).toStrictEqual(['value2'])
    filterOptions = parseFilter('property=value1,,value2')
    expect(filterOptions[0].values).toStrictEqual(['value1', 'value2'])
    filterOptions = parseFilter('property=value1,')
    expect(filterOptions[0].values).toStrictEqual(['value1'])
  })

  function createTestData(): number[] {
    return Array.from({ length: 95 }, () => randomInt(1000))
  }

  it('should return a proper middle page of paginated data', () => {
    const data = createTestData()
    const relevantData = data.slice(40, 60)
    expect(relevantData.length).toBe(20)
    const queryOptions = createListQueryHandler({ page: 3 })
    const requestUrl = new UrlHandler(createMockResponse(url), 'https')

    const pagiData = createPaginationData<number, PaginatedData>(
      queryOptions,
      requestUrl,
      95,
      relevantData,
    )

    expect(pagiData.pagination.pageNumber).toBe(3)
    expect(pagiData.pagination.pageSize).toBe(20)
    expect(pagiData.pagination.totalCount).toBe(95)
    expect(pagiData.data).toBe(relevantData as any[])
    expect(pagiData.links.first).toBe(`${namespaceUrl}?page=1&items=20`)
    expect(pagiData.links.last).toBe(`${namespaceUrl}?page=5&items=20`)
    expect(pagiData.links.next).toBe(`${namespaceUrl}?page=4&items=20`)
    expect(pagiData.links.prev).toBe(`${namespaceUrl}?page=2&items=20`)
  })

  it('should return a proper last page of paginated data', () => {
    const data = createTestData()
    const relevantData = data.slice(80)
    expect(relevantData.length).toBe(15)
    const queryOptions = createListQueryHandler({
      page: 5,
      sortOrder: SortOrder.ASC,
    })
    const requestUrl = new UrlHandler(createMockResponse(url), 'https')

    const pagiData = createPaginationData<number, PaginatedData>(
      queryOptions,
      requestUrl,
      95,
      relevantData,
    )

    expect(pagiData.pagination.pageNumber).toBe(5)
    expect(pagiData.pagination.pageSize).toBe(15)
    expect(pagiData.pagination.totalCount).toBe(95)
    expect(pagiData.data).toBe(relevantData as any[])
    expect(pagiData.links.first).toBe(
      `${namespaceUrl}?page=1&items=20&sortOrder=ASC`,
    )
    expect(pagiData.links.last).toBe(
      `${namespaceUrl}?page=5&items=20&sortOrder=ASC`,
    )
    expect(pagiData.links.prev).toBe(
      `${namespaceUrl}?page=4&items=20&sortOrder=ASC`,
    )
    expect(pagiData.links.next).toBeFalsy()
  })

  it('should return a proper first page of paginated data', () => {
    const data = createTestData()
    const relevantData = data.slice(0, 20)
    expect(relevantData.length).toBe(20)
    const queryOptions = createListQueryHandler({})
    const requestUrl = new UrlHandler(createMockResponse(url), 'https')

    const pagiData = createPaginationData<number, PaginatedData>(
      queryOptions,
      requestUrl,
      95,
      relevantData,
    )

    expect(pagiData.pagination.pageNumber).toBe(1)
    expect(pagiData.pagination.pageSize).toBe(20)
    expect(pagiData.pagination.totalCount).toBe(95)
    expect(pagiData.data).toBe(relevantData as any[])
    expect(pagiData.links.first).toBe(`${namespaceUrl}?page=1&items=20`)
    expect(pagiData.links.last).toBe(`${namespaceUrl}?page=5&items=20`)
    expect(pagiData.links.next).toBe(`${namespaceUrl}?page=2&items=20`)
    expect(pagiData.links.prev).toBeFalsy()
  })

  it('should return the given data as a one pager if total count of items is negative', () => {
    const data = createTestData()
    const relevantData = data.slice(40, 60)
    expect(relevantData.length).toBe(20)
    const queryOptions = createListQueryHandler({ page: 3 })
    const requestUrl = new UrlHandler(createMockResponse(url), 'https')

    const pagiData = createPaginationData<number, PaginatedData>(
      queryOptions,
      requestUrl,
      -95,
      relevantData,
    )

    expect(pagiData.pagination.pageNumber).toBe(1)
    expect(pagiData.pagination.pageSize).toBe(20)
    expect(pagiData.pagination.totalCount).toBe(20)
    expect(pagiData.data).toBe(relevantData as any[])
    expect(pagiData.links.first).toBe(`${namespaceUrl}?page=1&items=20`)
    expect(pagiData.links.last).toBe(`${namespaceUrl}?page=1&items=20`)
    expect(pagiData.links.next).toBeFalsy()
    expect(pagiData.links.prev).toBeFalsy()
  })

  it('should return paginated object empty data array if an empty data array is given', () => {
    const queryOptions = createListQueryHandler({ page: 6 })
    const requestUrl = new UrlHandler(createMockResponse(url), 'https')

    const pagiData = createPaginationData<number, PaginatedData>(
      queryOptions,
      requestUrl,
      95,
      [],
    )

    expect(pagiData.pagination.pageNumber).toBe(6)
    expect(pagiData.pagination.pageSize).toBe(0)
    expect(pagiData.pagination.totalCount).toBe(95)
    expect(pagiData.data.length).toBe(0)
    expect(pagiData.links.first).toBe(`${namespaceUrl}?page=1&items=20`)
    expect(pagiData.links.last).toBe(`${namespaceUrl}?page=5&items=20`)
    expect(pagiData.links.next).toBeFalsy()
    expect(pagiData.links.prev).toBeFalsy()
  })

  it('should return paginated object empty data array if a null data array is given', () => {
    const queryOptions = createListQueryHandler({ page: 6 })
    const requestUrl = new UrlHandler(createMockResponse(url), 'https')

    const pagiData = createPaginationData<number, PaginatedData>(
      queryOptions,
      requestUrl,
      95,
      null,
    )

    expect(pagiData.pagination.pageNumber).toBe(6)
    expect(pagiData.pagination.pageSize).toBe(0)
    expect(pagiData.pagination.totalCount).toBe(95)
    expect(pagiData.data.length).toBe(0)
    expect(pagiData.links.first).toBe(`${namespaceUrl}?page=1&items=20`)
    expect(pagiData.links.last).toBe(`${namespaceUrl}?page=5&items=20`)
    expect(pagiData.links.next).toBeFalsy()
    expect(pagiData.links.prev).toBeFalsy()
  })

  it('should return paginated object empty data array if an undefined data array is given', () => {
    const queryOptions = createListQueryHandler({ page: 6 })
    const requestUrl = new UrlHandler(createMockResponse(url), 'https')

    const pagiData = createPaginationData<number, PaginatedData>(
      queryOptions,
      requestUrl,
      95,
      undefined,
    )

    expect(pagiData.pagination.pageNumber).toBe(6)
    expect(pagiData.pagination.pageSize).toBe(0)
    expect(pagiData.pagination.totalCount).toBe(95)
    expect(pagiData.data.length).toBe(0)
    expect(pagiData.links.first).toBe(`${namespaceUrl}?page=1&items=20`)
    expect(pagiData.links.last).toBe(`${namespaceUrl}?page=5&items=20`)
    expect(pagiData.links.next).toBeFalsy()
    expect(pagiData.links.prev).toBeFalsy()
  })

  it('should enrich the query handler given with query constraints if ListQueryHandler.addToQueryBuilder is called', () => {
    const queryOptions = new ListQueryHandler(4, 15, SortOrder.ASC, 'testfield')
    let orderByItem: string
    let orderByOrder: SortOrder
    let skipValue: number
    let takeValue: number

    const queryBuilder = {
      orderBy: jest
        .fn()
        .mockImplementation((item: string, order: SortOrder) => {
          orderByItem = item
          orderByOrder = order
          return queryBuilder
        }),
      skip: jest.fn().mockImplementation((toSkip: number) => {
        skipValue = toSkip
        return queryBuilder
      }),
      take: jest.fn().mockImplementation((toTake: number) => {
        takeValue = toTake
        return queryBuilder
      }),
    } as unknown as SelectQueryBuilder<any>

    queryOptions.addToQueryBuilder<any>(queryBuilder, 'testtype')

    expect(orderByItem).toBe('testtype.testfield')
    expect(orderByOrder).toBe(SortOrder.ASC)
    expect(skipValue).toBe(45)
    expect(takeValue).toBe(15)
  })
})
