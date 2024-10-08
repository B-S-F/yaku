import {
  ListQueryHandler,
  PaginatedData,
  PaginationQueryOptions,
  UrlHandlerFactory,
  createPaginationData,
  parseFilter,
  queryOptionsSchema,
  toListQueryOptions,
  validateBody,
  validateId,
} from '@B-S-F/api-commons-lib'
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common'
import {
  ApiAcceptedResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOAuth2,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { ApiTooManyRequestsResponse } from '@nestjs/swagger/dist/decorators/api-response.decorator'
import { Response } from 'express'
import { z } from 'zod'
import { getUserFromRequest } from '../module.utils'
import { Run, RunResult, RunStatus } from './run.entity'
import { EVIDENCEFILE, RESULTFILE, RunService } from './run.service'

class RunDto {
  @ApiProperty({
    description: 'Id of the run in the context of this namespace',
    example: 1,
  })
  id: number

  @ApiProperty({
    description:
      'Status of the workflow, either pending, running, completed (workflow has been executed and an overall result exists), or failed (workflow broke without producing a result)',
    example: 'completed',
  })
  status: RunStatus

  @ApiProperty({
    description: 'Url of the config resource that is used for the qg run',
    example: 'https://qg-service.bswf.tech/api/v1/namespaces/1/configs/1/',
  })
  config: string

  @ApiPropertyOptional({
    description:
      'Overall result of the run, if workflow status is completed, this field contains either GREEN, YELLOW, RED, PENDING (all questions are unanswered) or FAILED (autopilots could not produce a result, e.g., due to bad credentials)',
    example: 'GREEN',
  })
  overallResult?: RunResult

  @ApiPropertyOptional({
    description: 'Timestamp when the workflow has been created',
    example: '2022-10-21 12:12:30.000',
  })
  creationTime?: Date

  @ApiPropertyOptional({
    description: 'Timestamp when a workflow has been completed',
    example: '2022-10-21 12:12:30.000',
  })
  completionTime?: Date
}

class DetailedRunDto extends RunDto {
  @ApiPropertyOptional({
    description:
      'Workflow information, only relevant for checking the Argo workflow engine',
    example: 'argo',
  })
  argoNamespace?: string

  @ApiPropertyOptional({
    description:
      'Workflow information, only relevant for checking the Argo workflow engine',
    example: 'qg-run-cbc6x',
  })
  argoName?: string

  @ApiPropertyOptional({
    description:
      'The log of the workflow run or other log information created during workflow execution',
    example: "[ 'Error while starting the workflow' ]",
  })
  log?: string[]
}

function toOutputDto(
  run: Run,
  configsUrl: string,
  details = false
): RunDto | DetailedRunDto {
  const dto = details ? new DetailedRunDto() : new RunDto()
  dto.id = run.id
  dto.status = run.status
  dto.config = `${configsUrl}/${run.config.id}`
  if (run.overallResult) {
    dto.overallResult = run.overallResult
  }
  if (run.creationTime) {
    dto.creationTime = run.creationTime
  }
  if (run.completionTime) {
    dto.completionTime = run.completionTime
  }
  if (details) {
    const ddto = dto as DetailedRunDto
    if (run.argoNamespace) {
      ddto.argoNamespace = run.argoNamespace
    }
    if (run.argoName) {
      ddto.argoName = run.argoName
    }
    if (run.log) {
      ddto.log = run.log
    }
  }
  return dto
}

class RunListDto extends PaginatedData {
  @ApiProperty({
    description: 'Run resources of the returned page',
    type: RunDto,
    isArray: true,
  })
  data: RunDto[]
}

class SingleCheckDto {
  @ApiProperty({
    description:
      'To execute a single check only, specify the chapter id of the check in this property',
    example: 'chapter_1',
    type: 'string',
  })
  chapter: string

  @ApiProperty({
    description:
      'To execute a single check only, specify the requirement id of the check in this property',
    example: 'req_1',
    type: 'string',
  })
  requirement: string

  @ApiProperty({
    description:
      'To execute a single check only, specify the check id of the check in this property',
    example: 'check_1',
    type: 'string',
  })
  check: string
}

class RunPostDto {
  @ApiProperty({
    description: 'Id of the config resource that is used for the qg run',
    example: 3,
    type: 'integer',
    minimum: 1,
  })
  configId: number

  @ApiPropertyOptional({
    description:
      'Environment variables to override. Do not try to override secrets. They will be ignored anyways.',
    example: { ENV_KEY1: 'env-value1', ENV_KEY2: 'env-value2' },
    type: 'object',
  })
  environment?: { [s: string]: string }

  @ApiPropertyOptional({
    description:
      'Use this property to select only one check to be executed in the workflow',
    example: { chapter: 'chapter_1', requirement: 're1_1', check: 'check_1' },
    type: 'object',
  })
  singleCheck?: SingleCheckDto
}

const postSchema = z
  .object({
    configId: z.number().int().positive(),
    environment: z.record(z.string().trim().min(1), z.string()).optional(),
    singleCheck: z
      .object({
        chapter: z.string().trim().min(1),
        requirement: z.string().trim().min(1),
        check: z.string().trim().min(1),
      })
      .optional(),
  })
  .strict()

const allowedSortProperties = ['id', 'creationTime', 'completionTime', 'config']

class RunsQueryOptions extends PaginationQueryOptions {
  @ApiPropertyOptional({
    description: `Sort runs by the given property, allowed properties are ${allowedSortProperties}`,
    type: 'string',
    example: 'id',
    default: 'id',
  })
  sortBy?: string

  @ApiPropertyOptional({
    description:
      'Multiple filter expressions to limit the returned entities for the given filter options, i.e., use multiple filter expressions in the url. Available for options "config" with a list of ids and "latestOnly" with a value "true"',
    type: 'string',
    example: 'config=1,2',
    default: 'No filter',
  })
  filter?: string[] | string
}

const runQuerySchema = queryOptionsSchema
  .extend({
    filter: z
      .union([z.array(z.string().trim().min(1)), z.string().trim().min(1)])
      .optional(),
  })
  .strict()

@ApiBearerAuth()
@ApiOAuth2(['openid'])
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiForbiddenResponse({ description: 'Forbidden' })
@ApiTags('Run')
@Controller(':namespaceId/runs')
export class RunController {
  constructor(
    @Inject(RunService) readonly service: RunService,
    @Inject(UrlHandlerFactory) readonly urlHandler: UrlHandlerFactory
  ) {}

  @Get()
  @ApiOperation({
    summary:
      'Retrieve runs in the namespace, the list is paged and allows to filter for the config',
  })
  @ApiTooManyRequestsResponse({
    description:
      'The endpoint is temporarily blocked for the given namespace due to too many requests',
  })
  @ApiOkResponse({
    description: 'A list of runs started in this namespace',
    type: RunListDto,
  })
  async getRuns(
    @Param('namespaceId') namespaceId: number,
    @Query() queryOptions: RunsQueryOptions,
    @Res({ passthrough: true }) response: Response
  ): Promise<RunListDto> {
    validateId(namespaceId)
    const listQueryOptions: ListQueryHandler = toListQueryOptions(
      queryOptions,
      runQuerySchema,
      allowedSortProperties,
      'id'
    )
    const filtering = parseFilter(queryOptions.filter)
    if (filtering) {
      listQueryOptions.additionalParams.filtering = filtering
    }
    const requestUrl = this.urlHandler.getHandler(response)

    const rawData = await this.service.getList(namespaceId, listQueryOptions)
    const data = rawData.entities.map((run) =>
      toOutputDto(run, requestUrl.url('/configs', 1))
    )

    return createPaginationData<RunDto, RunListDto>(
      listQueryOptions,
      requestUrl,
      rawData.itemCount,
      data
    )
  }

  @Post()
  @ApiOperation({
    summary: 'Start a new qg run with the given config',
  })
  @ApiAcceptedResponse({
    description: 'Run workflow started successfully',
    type: RunDto,
  })
  @ApiTooManyRequestsResponse({
    description:
      'The endpoint is temporarily blocked for the given namespace due to too many requests',
  })
  @ApiNotFoundResponse({
    description: 'The referenced config for starting the run was not found',
  })
  @ApiBadRequestResponse({
    description: 'The configId parameter was not provided',
  })
  @ApiBody({ type: RunPostDto })
  async create(
    @Param('namespaceId') namespaceId: number,
    @Body() dto: RunPostDto,
    @Res({ passthrough: true }) response: Response
  ): Promise<RunDto> {
    validateBody(dto, postSchema)
    validateId(namespaceId)
    validateId(dto.configId)

    const user = getUserFromRequest(response.req)

    const requestUrl = this.urlHandler.getHandler(response)

    const run = await this.service.create(namespaceId, dto.configId, user, {
      environment: dto.environment ?? {},
      singleCheck: dto.singleCheck,
    })

    response.header('Location', requestUrl.url(`/${run.id}`))
    response.status(HttpStatus.ACCEPTED)

    return toOutputDto(run, requestUrl.url('/configs', 1))
  }

  @Get(':runId')
  @ApiOperation({
    summary: 'Get the requested run resource data',
  })
  @ApiTooManyRequestsResponse({
    description:
      'The endpoint is temporarily blocked for the given namespace due to too many requests',
  })
  @ApiOkResponse({
    description: 'Requested Run resource data',
    type: DetailedRunDto,
  })
  @ApiNotFoundResponse({ description: 'Resource with given id not found' })
  async get(
    @Param('namespaceId') namespaceId: number,
    @Param('runId') runId: number,
    @Res({ passthrough: true }) response: Response
  ): Promise<DetailedRunDto> {
    validateId(runId)

    const requestUrl = this.urlHandler.getHandler(response)
    return toOutputDto(
      await this.service.get(namespaceId, runId),
      requestUrl.url('/configs', 2),
      true
    )
  }

  @Get(':runId/results')
  @ApiOperation({ summary: 'Returns the results yaml file of a qg run.' })
  @ApiProduces('application/yaml')
  @ApiOkResponse({ description: 'The result yaml file of the run.' })
  @ApiNotFoundResponse({ description: 'The referenced run does not exist' })
  @ApiBadRequestResponse({
    description:
      'The results for the run are not available, either the run has not finished, or it has failed',
  })
  async getResult(
    @Param('namespaceId') namespaceId: number,
    @Param('runId') runId: number,
    @Res({ passthrough: true }) response: Response
  ): Promise<StreamableFile> {
    validateId(runId)
    validateId(namespaceId)

    const content = await this.service.getResult(namespaceId, runId)

    response.header('Content-Type', 'application/yaml')
    response.header(
      'Content-Disposition',
      `attachment; filename="${RESULTFILE}"`
    )

    return new StreamableFile(content)
  }

  @Get(':runId/evidences')
  @ApiOperation({
    summary: 'Returns the work folder content of a qg run as a zipped file.',
  })
  @ApiProduces('application/zip')
  @ApiOkResponse({
    description: 'A zip file packing the work folder of the run',
  })
  @ApiNotFoundResponse({ description: 'The referenced run does not exist' })
  @ApiBadRequestResponse({
    description:
      'The results for the run are not available, either the run has not finished, or it has failed',
  })
  async getEvidence(
    @Param('namespaceId') namespaceId: number,
    @Param('runId') runId: number,
    @Res({ passthrough: true }) response: Response
  ) {
    validateId(runId)
    validateId(namespaceId)

    const content = await this.service.getEvidence(namespaceId, runId)

    response.header('Content-Type', 'application/zip')
    response.header(
      'Content-Disposition',
      `attachment; filename="${EVIDENCEFILE}"`
    )

    return new StreamableFile(content)
  }

  @Delete(':runId')
  @ApiOperation({ summary: 'Delete the given run' })
  @ApiOkResponse({ description: 'Run resource deleted' })
  @ApiBadRequestResponse({
    description: 'Given idsRuns in state running cannot be deleted',
  })
  async delete(
    @Param('namespaceId') namespaceId: number,
    @Param('runId') runId: number,
    @Res({ passthrough: true }) response: Response
  ): Promise<void> {
    validateId(runId)
    validateId(namespaceId)

    const user = getUserFromRequest(response.req)

    await this.service.delete(namespaceId, runId, user)
  }
}
