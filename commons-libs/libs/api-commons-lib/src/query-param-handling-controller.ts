import { BadRequestException } from '@nestjs/common'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { ZodSchema, z } from 'zod'
import { validateBody } from './input-validator'
import { ListQueryHandler, SortOrder } from './query-param-handling-service'
import { UrlHandler } from './url-handler'

const DEFAULT_ITEMS_SIZE = 20
const DEFAULT_PAGE = 1

export const SERVICE_PROTOCOL = process.env.SERVICE_PROTOCOL || 'https'

class Pagination {
  @ApiProperty({
    description: 'Page within the complete list returned by the call',
    example: 1,
  })
  pageNumber: number

  @ApiProperty({
    description: 'Size of the page returned by the call',
    example: 10,
  })
  pageSize: number

  @ApiProperty({
    description: 'Total number of items in the list',
    example: 20,
  })
  totalCount: number
}

class Links {
  @ApiProperty({
    description: 'Link to the previous page if this exists',
    example:
      'https://domain.gTLD/api/v1/namespaces/{namespaceId}/{endpoint}?page=1&items=20',
  })
  prev?: string

  @ApiProperty({
    description: 'Link to the next page if this exists',
    example:
      'https://domain.gTLD/api/v1/namespaces/{namespaceId}/{endpoint}?page=3&items=20',
  })
  next?: string

  @ApiProperty({
    description: 'Link to the last page',
    example:
      'https://domain.gTLD/api/v1/namespaces/{namespaceId}/{endpoint}?page=5&items=20',
  })
  last: string

  @ApiProperty({
    description: 'Link to the first page',
    example:
      'https://domain.gTLD/api/v1/namespaces/{namespaceId}/{endpoint}?page=1&items=20',
  })
  first: string
}

export function createPaginationData<T, L extends PaginatedData>(
  queryOptions: ListQueryHandler,
  requestUrl: UrlHandler,
  totalItemCount: number,
  data: T[],
): L {
  const dataItems = data ?? []
  const totalItems = totalItemCount > 0 ? totalItemCount : data.length
  const calcPage = totalItemCount > 0 ? queryOptions.page : 1

  return {
    pagination: {
      pageNumber: calcPage,
      pageSize: dataItems.length,
      totalCount: totalItems,
    },
    data: dataItems,
    links: createLinksSection(
      requestUrl,
      calcPage,
      queryOptions.items,
      totalItems,
      queryOptions.sortOrder,
    ),
  } as unknown as L
}

function createLinksSection(
  requestUrl: UrlHandler,
  currentPage: number,
  itemCountPerPage: number,
  totalItemCount: number,
  sortOrder: SortOrder,
): Links {
  const maxPages = Math.max(Math.ceil(totalItemCount / itemCountPerPage), 1)

  let afterPage = `&items=${itemCountPerPage}`
  if (sortOrder === SortOrder.ASC) {
    afterPage = `${afterPage}&sortOrder=ASC`
  }
  const links: Links = {
    first: requestUrl.url(`?page=1${afterPage}`),
    last: requestUrl.url(`?page=${maxPages}${afterPage}`),
  }
  if (currentPage > 1 && currentPage <= maxPages) {
    links.prev = requestUrl.url(`?page=${currentPage - 1}${afterPage}`)
  }
  if (currentPage < maxPages) {
    links.next = requestUrl.url(`?page=${currentPage + 1}${afterPage}`)
  }
  return links
}

export class PaginatedData {
  @ApiProperty({
    description: 'Pagination information',
    type: Pagination,
  })
  pagination: Pagination

  @ApiProperty({
    description: 'Resources of the returned page',
    isArray: true,
  })
  readonly data: any[]

  @ApiProperty({
    description: 'Links to surrounding pages',
    type: Links,
  })
  links: Links
}

export class PaginationQueryOptions {
  @ApiPropertyOptional({
    description: 'The requested page of the list of existing resources',
    type: 'Integer',
    minimum: 1,
    example: 1,
    default: DEFAULT_PAGE,
  })
  page?: number

  @ApiPropertyOptional({
    description: 'The amount of items on the page',
    type: 'Integer',
    minimum: 1,
    example: 20,
    default: DEFAULT_ITEMS_SIZE,
  })
  items?: number

  @ApiPropertyOptional({
    description: `Sort order of the returned objects, must be one of ${Object.keys(
      SortOrder,
    )}`,
    type: 'string',
    default: SortOrder.DESC,
  })
  sortOrder?: SortOrder

  sortBy?: string
}

export const queryOptionsSchema = z.object({
  page: z.number().int().positive().optional(),
  items: z.number().int().positive().optional(),
  sortOrder: z.nativeEnum(SortOrder).optional(),
  sortBy: z.string().trim().nonempty().optional(),
})

export function toListQueryOptions(
  options: PaginationQueryOptions,
  schema: ZodSchema,
  allowedSortProperties: string[],
  defaultSortBy: string,
): ListQueryHandler {
  if (options.page) {
    options.page = Number(options.page)
  }
  if (options.items) {
    options.items = Number(options.items)
  }
  validateBody(options, schema)

  const page = options.page ?? DEFAULT_PAGE
  const items = options.items ?? DEFAULT_ITEMS_SIZE
  const order = options.sortOrder ?? SortOrder.DESC
  const sorter = options.sortBy ?? defaultSortBy

  if (!allowedSortProperties.includes(sorter) && sorter !== defaultSortBy) {
    throw new BadRequestException(
      `Sorting by property ${options.sortBy} not supported`,
    )
  }

  return new ListQueryHandler(page, items, order, sorter)
}
