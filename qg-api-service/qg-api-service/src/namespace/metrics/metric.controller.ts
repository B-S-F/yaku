import { Controller, Get, Inject, Param, Query, Res } from '@nestjs/common'
import { GetFindingsDTO } from './dto/getFindings.dto'
import { MetricService } from './metric.service'
import { StatusType } from '../findings/utils/enums/statusType.enum'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOAuth2,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import {
  createPaginationData,
  ListQueryHandler,
  PaginationQueryOptions,
  queryOptionsSchema,
  UrlHandlerFactory,
  validateId,
  validateDate,
  PaginatedData,
  toListQueryOptions,
} from '@B-S-F/api-commons-lib'
import { Logger, PinoLogger, InjectPinoLogger } from 'nestjs-pino'

const allowedSortProperties = ['count', 'runId', 'configId', 'diff', 'datetime']

class GetListFindingsDTO extends PaginatedData {
  @ApiProperty({
    description: 'Findings metrics resources of the returned page',
    type: GetFindingsDTO,
    isArray: true,
  })
  data: GetFindingsDTO[]
}

class FindingsQueryOptions extends PaginationQueryOptions {
  @ApiPropertyOptional({
    description: `Sort Findings metrics by the given property. Allowed properties: ${allowedSortProperties}`,
    type: 'string',
    example: 'count',
    default: 'count',
  })
  sortBy?: string

  @ApiPropertyOptional({
    description: 'Filter Findings metrics based on configId',
    type: 'number',
    example: 1,
    default: 'No filter',
  })
  configId?: number
}

class LatestRunFindingsQueryOptions extends PaginationQueryOptions {
  @ApiPropertyOptional({
    description: `Sort Findings metrics by given property, Allowed properties: ${allowedSortProperties}`,
    type: 'string',
    example: 'count',
    default: 'count',
  })
  sortBy?: string
}

class FindingsInRangeQueryOptions extends PaginationQueryOptions {
  @ApiPropertyOptional({
    description: `Sort Findings metrics by the givent property, Allowed properties: ${allowedSortProperties}`,
    type: 'string',
    example: 'count',
    default: 'count',
  })
  sortBy?: string

  @ApiPropertyOptional({
    description: 'Filter Findings metrics based on configId',
    type: 'number',
    example: 1,
    default: 'No filter',
  })
  configId?: number

  @ApiProperty({
    description: 'Filter Findings metrics for runs starting with Timestamp',
    type: 'string',
    example: '1970-01-01 00:00:00',
  })
  startRange: string

  @ApiProperty({
    description: 'Filter Findings metrics for runs ending before Timestamp',
    type: 'string',
    example: '2038-01-19 03:14:07',
  })
  endRange: string
}

class LatestRunFindingsInRangeQueryOptions extends PaginationQueryOptions {
  @ApiPropertyOptional({
    description: `Sort Findings metrics by given property, Allowed properties: ${allowedSortProperties}`,
    type: 'string',
    example: 'count',
    default: 'count',
  })
  sortBy?: string

  @ApiProperty({
    description: 'Filter Findings metrics for runs starting with Timestamp',
    type: 'string',
    example: '1970-01-01 00:00:00',
  })
  startRange: string

  @ApiProperty({
    description: 'Filter Findings metrics for runs ending before Timestamp',
    type: 'string',
    example: '2038-01-19 03:14:07',
  })
  endRange: string
}

@Controller(':namespaceId/metrics')
@ApiBearerAuth()
@ApiOAuth2(['openid'])
@ApiTags('Metrics')
export class MetricController {
  @InjectPinoLogger(MetricController.name)
  private readonly logger = new Logger(
    new PinoLogger({
      pinoHttp: {
        level: 'debug',
        serializers: {
          req: () => undefined,
          res: () => undefined,
        },
      },
    }),
    {}
  )

  constructor(
    private readonly service: MetricService,
    @Inject(UrlHandlerFactory) readonly urlHandler: UrlHandlerFactory
  ) {}

  @Get('findings')
  @ApiOperation({
    summary:
      'Retrieve Findings metrics in the namespace, the list is paged and allows to filter by associated config',
  })
  @ApiOkResponse({
    description: 'A list of Findings metrics in this namespace',
    type: GetListFindingsDTO,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async getFindings(
    @Param('namespaceId') namespaceId: number,
    @Query() queryOptions: FindingsQueryOptions,
    @Res({ passthrough: true }) response: any
  ): Promise<GetListFindingsDTO> {
    validateId(namespaceId)
    try {
      const paginateQueryOptions: ListQueryHandler = toListQueryOptions(
        queryOptions,
        queryOptionsSchema,
        allowedSortProperties,
        'count'
      )
      const requestUrl = this.urlHandler.getHandler(response)

      let rawData: any
      if (queryOptions.configId) {
        rawData = await this.service.getNrOfFindingsByConfigId(
          namespaceId,
          StatusType.UNRESOLVED,
          queryOptions.configId,
          paginateQueryOptions
        )
      } else {
        rawData = await this.service.getNrOfFindings(
          namespaceId,
          StatusType.UNRESOLVED,
          paginateQueryOptions
        )
      }

      return createPaginationData<GetFindingsDTO, GetListFindingsDTO>(
        paginateQueryOptions,
        requestUrl,
        rawData.itemCount,
        rawData.entities
      )
    } catch (error) {
      this.logger.error(`Error in findings: ${error.message}`)
      throw error
    }
  }

  @Get('findingsInRange')
  @ApiOperation({
    summary:
      'Retrieve Findings metrics between specified range in the namespace, the list is paged and allows to filter by associated config',
  })
  @ApiOkResponse({
    description: 'A list of Findings metrics in this namespace',
    type: GetListFindingsDTO,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async getFindingsInRange(
    @Param('namespaceId') namespaceId: number,
    @Query() queryOptions: FindingsInRangeQueryOptions,
    @Res({ passthrough: true }) response: any
  ): Promise<GetListFindingsDTO> {
    validateId(namespaceId)
    try {
      validateDate(queryOptions.startRange)
      validateDate(queryOptions.endRange)

      const paginateQueryOptions: ListQueryHandler = toListQueryOptions(
        queryOptions,
        queryOptionsSchema,
        allowedSortProperties,
        'count'
      )
      const requestUrl = this.urlHandler.getHandler(response)

      let rawData: any
      if (queryOptions.configId) {
        rawData = await this.service.getNrOfFindingsInRangeByConfigId(
          namespaceId,
          StatusType.UNRESOLVED,
          queryOptions.startRange,
          queryOptions.endRange,
          queryOptions.configId,
          paginateQueryOptions
        )
      } else {
        rawData = await this.service.getNrOfFindingsInRange(
          namespaceId,
          StatusType.UNRESOLVED,
          queryOptions.startRange,
          queryOptions.endRange,
          paginateQueryOptions
        )
      }

      return createPaginationData<GetFindingsDTO, GetListFindingsDTO>(
        paginateQueryOptions,
        requestUrl,
        rawData.itemCount,
        rawData.entities
      )
    } catch (error) {
      this.logger.error(`Error in findingsInRange: ${error.message}`)
      throw error
    }
  }

  @Get('latestRunFindings')
  @ApiOperation({
    summary: 'Retrieve Findings metrics of the latest run in the namespace',
  })
  @ApiOkResponse({
    description: 'A list of Findings metrics in this namespace',
    type: GetListFindingsDTO,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async getLatestRunFindings(
    @Param('namespaceId') namespaceId: number,
    @Query() queryOptions: LatestRunFindingsQueryOptions,
    @Res({ passthrough: true }) response: any
  ): Promise<GetListFindingsDTO> {
    validateId(namespaceId)
    try {
      const paginateQueryOptions: ListQueryHandler = toListQueryOptions(
        queryOptions,
        queryOptionsSchema,
        allowedSortProperties,
        'count'
      )
      const requestUrl = this.urlHandler.getHandler(response)

      const rawData = await this.service.getLatestRunNrOfFindings(
        namespaceId,
        StatusType.UNRESOLVED,
        paginateQueryOptions
      )

      return createPaginationData<GetFindingsDTO, GetListFindingsDTO>(
        paginateQueryOptions,
        requestUrl,
        rawData.itemCount,
        rawData.entities
      )
    } catch (error) {
      this.logger.error(`Error in latestRunFindings: ${error.message}`)
      throw error
    }
  }

  @Get('latestRunFindingsInRange')
  @ApiOperation({
    summary:
      'Retrieve Findings metrics of the latst run between specified range in the namespace',
  })
  @ApiOkResponse({
    description: 'A list of Findings metrics in this namespace',
    type: GetListFindingsDTO,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async getLatestRunFindingsInRange(
    @Param('namespaceId') namespaceId: number,
    @Query() queryOptions: LatestRunFindingsInRangeQueryOptions,
    @Res({ passthrough: true }) response: any
  ): Promise<GetListFindingsDTO> {
    validateId(namespaceId)
    try {
      validateDate(queryOptions.startRange)
      validateDate(queryOptions.endRange)

      const paginateQueryOptions: ListQueryHandler = toListQueryOptions(
        queryOptions,
        queryOptionsSchema,
        allowedSortProperties,
        'count'
      )
      const requestUrl = this.urlHandler.getHandler(response)

      const rawData = await this.service.getLatestRunNrOfFindingsInRange(
        namespaceId,
        StatusType.UNRESOLVED,
        queryOptions.startRange,
        queryOptions.endRange,
        paginateQueryOptions
      )

      return createPaginationData<GetFindingsDTO, GetListFindingsDTO>(
        paginateQueryOptions,
        requestUrl,
        rawData.itemCount,
        rawData.entities
      )
    } catch (error) {
      this.logger.error(`Error in latestRunFindingsInRange: ${error.message}`)
      throw error
    }
  }
}
