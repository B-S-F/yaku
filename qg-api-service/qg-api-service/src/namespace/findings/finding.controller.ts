import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Logger,
  Res,
  ForbiddenException,
  Query,
  Inject,
  Patch,
} from '@nestjs/common'
import {
  ApiTags,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiOperation,
  ApiBearerAuth,
  ApiOAuth2,
  ApiProperty,
  ApiPropertyOptional,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger'
import { UpdateFindingDTO } from './dto/update-finding.dto'
import { GetFindingDTO } from './dto/get-finding.dto'
import { ErrorResponseDTO } from './dto/error-response.dto'
import { FindingService } from './finding.service'
import {
  ListQueryHandler,
  PaginationQueryOptions,
  UrlHandlerFactory,
  createPaginationData,
  parseFilter,
  validateFilter,
  validateId,
  validateName,
  PaginatedData,
  toListQueryOptions,
  queryOptionsSchema,
} from '@B-S-F/api-commons-lib'

export class GetListFindingsDTO extends PaginatedData {
  @ApiProperty({
    type: GetFindingDTO,
    isArray: true,
  })
  data: GetFindingDTO[]
}

export const allowedSortProperties = [
  'id',
  'configId',
  'runId',
  'runStatus',
  'runCompletionTime',
  'occurrenceCount',
  'status',
  'resolvedDate',
  'resolver',
  'createdAt',
  'updatedAt',
]

export class FindingsQueryOptions extends PaginationQueryOptions {
  @ApiPropertyOptional({
    description: `Sort findings by the given property, allowed properties are ${allowedSortProperties.join(
      ', '
    )}`,
    type: 'string',
    example: 'id',
    default: 'updatedAt',
  })
  sortBy?: string

  @ApiPropertyOptional({
    description:
      'Multiple filter expressions to limit the returned entities for the given filter options, i.e., use multiple filter expressions in the url. Available for options "configId" with a list of ids',
    type: 'string',
    example: 'configId=1,2',
    default: 'No filter',
  })
  filter?: string[] | string
}

@Controller(':namespaceId/findings')
@ApiOAuth2(['openid'])
@ApiBearerAuth()
@ApiTags('Findings')
export class FindingController {
  private readonly logger = new Logger(FindingController.name)

  constructor(
    private readonly findingService: FindingService,
    @Inject(UrlHandlerFactory) readonly urlHandler: UrlHandlerFactory
  ) {}

  @Get()
  @ApiResponse({
    status: 200,
    description:
      'Get all findings in a namespace, the list is paged and allows to filter for a config file',
    type: [GetFindingDTO],
  })
  @ApiTooManyRequestsResponse({
    description:
      'The endpoint is temporarily blocked for the given namespace due to too many requests',
  })
  @ApiOperation({ summary: 'Get all findings in a namespace' })
  async getAllFindingsInNamespace(
    @Param('namespaceId') namespaceId: number,
    @Res({ passthrough: true }) res,
    @Query() queryOptions: FindingsQueryOptions
  ): Promise<GetListFindingsDTO> {
    validateId(namespaceId)
    if (queryOptions.sortBy !== undefined) {
      validateName(queryOptions.sortBy)
    }
    if (queryOptions.filter !== undefined) {
      validateFilter(queryOptions.filter)
    }
    try {
      const paginateQueryOptions: ListQueryHandler = toListQueryOptions(
        queryOptions,
        queryOptionsSchema,
        allowedSortProperties,
        'updatedAt'
      )

      const filtering = parseFilter(queryOptions.filter)
      if (filtering) {
        paginateQueryOptions.additionalParams.filtering = filtering
      }

      const requestUrl = this.urlHandler.getHandler(res)
      const rawData = await this.findingService.getAllFindings(
        namespaceId,
        paginateQueryOptions
      )

      return createPaginationData<GetFindingDTO, GetListFindingsDTO>(
        paginateQueryOptions,
        requestUrl,
        rawData.itemCount,
        rawData.entities
      )
    } catch (error) {
      this.logger.error(`Error in getAllFindingsInNamespace: ${error.message}`)
      throw new ForbiddenException(new ErrorResponseDTO(error.message))
    }
  }

  @Get(':findingId')
  @ApiParam({ name: 'namespaceId', description: 'Namespace ID' })
  @ApiParam({ name: 'findingId', description: 'Finding ID' })
  @ApiOperation({ summary: 'Get a finding' })
  @ApiResponse({
    status: 200,
    description: 'Get a finding by ID',
    type: GetFindingDTO,
  })
  async getFindingById(
    @Param('namespaceId') namespaceId: number,
    @Param('findingId', new ParseUUIDPipe()) findingId: string
  ): Promise<GetFindingDTO> {
    validateId(namespaceId)
    try {
      return await this.findingService.getFindingById(namespaceId, findingId)
    } catch (error) {
      this.logger.error(`Error in getFindingById: ${error.message}`)
      throw new BadRequestException(error.message)
    }
  }

  @Patch(':findingId')
  @ApiParam({ name: 'namespaceId', description: 'Namespace ID' })
  @ApiParam({ name: 'findingId', description: 'Finding ID' })
  @ApiOperation({ summary: 'Update a finding' })
  @ApiBody({ type: UpdateFindingDTO })
  @ApiResponse({
    status: 200,
    description: 'Update a finding',
    type: GetFindingDTO,
  })
  async updateFinding(
    @Param('namespaceId') namespaceId: number,
    @Param('findingId', new ParseUUIDPipe()) findingId: string,
    @Body() updateFindingDto: UpdateFindingDTO
  ): Promise<GetFindingDTO> {
    validateId(namespaceId)
    try {
      return this.findingService.updateFinding(
        namespaceId,
        findingId,
        updateFindingDto
      )
    } catch (error) {
      this.logger.error(`Error in updateFinding: ${error.message}`)
      throw new BadRequestException(new ErrorResponseDTO(error.message))
    }
  }

  @Delete(':findingId')
  @ApiParam({ name: 'namespaceId', description: 'Namespace ID' })
  @ApiParam({ name: 'findingId', description: 'Finding ID' })
  @ApiResponse({ status: 204, description: 'Delete a finding' })
  @ApiOperation({ summary: 'Delete a finding' })
  async deleteFinding(
    @Param('namespaceId') namespaceId: number,
    @Param('findingId', new ParseUUIDPipe()) findingId: string
  ) {
    validateId(namespaceId)
    try {
      return await this.findingService.deleteFinding(namespaceId, findingId)
    } catch (error) {
      this.logger.error(`Error in deleteFinding: ${error.message}`)
      throw new BadRequestException(new ErrorResponseDTO(error.message))
    }
  }
}
