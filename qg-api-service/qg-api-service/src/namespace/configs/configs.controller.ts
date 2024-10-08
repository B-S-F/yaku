import {
  ListQueryHandler,
  PaginatedData,
  PaginationQueryOptions,
  UrlHandlerFactory,
  createPaginationData,
  queryOptionsSchema,
  toListQueryOptions,
  validateBody,
  validateId,
  validateName,
} from '@B-S-F/api-commons-lib'
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  FileValidator,
  Get,
  HttpStatus,
  Inject,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common'
import { FileFieldsInterceptor } from '@nestjs/platform-express'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiExcludeEndpoint,
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
  OmitType,
  PartialType,
} from '@nestjs/swagger'
import { Response } from 'express'
import { z } from 'zod'
import { MAX_FILE_SIZE_MB } from '../../config'
import { JsonValidatorService } from '../../gp-services/json-validator.service'
import { YamlValidatorService } from '../../gp-services/yaml-validator.service'
import { ConfigEntity } from './config.entity'
import { ConfigsService } from './configs.service'

class FileList {
  @ApiPropertyOptional({
    description:
      'Reference to the qg-config file of the config resource, might be non-existing',
    example:
      'https://qg-service.bswf.tech/api/v1/namespaces/1/configs/1/files/qg-config.yaml',
  })
  qgConfig?: string

  @ApiPropertyOptional({
    description: 'List of additional config files for specific autopilots',
    example:
      "[ 'https://qg-service.bswf.tech/api/v1/namespaces/1/configs/1/files/ado-config.yaml' ]",
  })
  additionalConfigs?: string[]
}

class ConfigDto {
  @ApiProperty({
    description: 'Id of the config resource in the context of the namespace',
    example: 1,
  })
  id: number

  @ApiProperty({
    description: 'Name of the config resource',
    example: 'QG-R Config',
    type: 'string',
  })
  name: string

  @ApiPropertyOptional({
    description: 'Optional description of the config resource',
    example: 'Config based on questionnaire 2022/10',
    type: 'string',
  })
  description?: string | null

  @ApiProperty({
    description: 'Creation time of the config resource',
    example: '2022-10-21 12:12:30.000',
  })
  creationTime: Date

  @ApiProperty({
    description: 'Last Modification time of the config resource',
    example: '2022-10-21 12:12:30.000',
  })
  lastModificationTime: Date

  @ApiProperty({
    description: 'List of all aggregated files as URL to the file resource',
  })
  files: FileList
}

function toOutputDto(config: ConfigEntity, url: string): ConfigDto {
  const dto = new ConfigDto()
  dto.id = config.id
  dto.name = config.name
  if (config.description) {
    dto.description = config.description
  }
  dto.creationTime = config.creationTime
  dto.lastModificationTime = config.lastModificationTime
  dto.files = new FileList()
  if (config.files) {
    if (config.qgConfig()) {
      dto.files.qgConfig = `${url}/${config.qgConfig().filename}`
    }
    if (config.additionalConfigs().length > 0) {
      dto.files.additionalConfigs = config
        .additionalConfigs()
        .map((file) => `${url}/${encodeURIComponent(file.filename)}`)
    }
  }
  return dto
}

class ConfigPostDto extends OmitType(ConfigDto, [
  'id',
  'creationTime',
  'lastModificationTime',
  'files',
]) {}

const postSchema = z
  .object({
    name: z.string().trim().min(1),
    description: z.string().optional(),
  })
  .strict()

class ConfigPatchDto extends PartialType(ConfigPostDto) {}

const patchSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    description: z.union([z.string(), z.null()]).optional(),
  })
  .strict()
  .refine(
    (value) =>
      Boolean(value.name || value.description || value.description === null),
    {
      message: `At least one of the properties 'name' or 'description' need to be changed`,
    }
  )

class ConfigListDto extends PaginatedData {
  @ApiProperty({
    description: 'Configs of the returned page',
    type: ConfigDto,
    isArray: true,
  })
  data: ConfigDto[]
}

class ValidationReport {
  @ApiProperty({
    description: 'Url reference of the validated config resource',
    example: 'https://qg-service.bswf.tech/api/v1/namespaces/1/configs/1',
  })
  validated: string

  @ApiProperty({
    description:
      "Status of the validation, either 'Green' (no findings), 'Yellow' (minor findings), or 'Red' (major findings)",
    example: 'Yellow',
  })
  status: any

  @ApiProperty({
    description: 'List of findings identified during the validation run',
    example:
      "File 'add_config.yaml' referenced in qg-config but not found in referenced files",
  })
  findings: string[]
}

class ExcelQuestionnaire {
  @ApiProperty({
    description:
      'An excel sheet storing the questions to be answered for the quality gate',
    type: 'string',
    format: 'binary',
  })
  xlsx: Express.Multer.File

  @ApiProperty({
    description:
      'A configuration that defines the relevant columns and rows in the given excel sheet',
    type: 'string',
    format: 'binary',
  })
  config: Express.Multer.File
}

const excelSchema = z
  .object({
    xlsx: z.any(),
    config: z.any(),
  })
  .strict()

export type ExcelSchema = z.infer<typeof excelSchema>

class CopyConfigDto {
  @ApiProperty({
    description: 'New Name of the copied config resource',
    example: 'QG-R Config Copy',
    type: 'string',
  })
  name: string

  @ApiPropertyOptional({
    description:
      'Optional description of the copied config resource, if not given it will be set to the original description',
    example: 'Copy of config based on questionnaire 2022/10',
    type: 'string',
  })
  description?: string
}

const copyConfigSchema = z
  .object({
    name: z.string().trim().min(1),
    description: z.string().optional(),
  })
  .strict()

export type CopyConfigSchema = z.infer<typeof copyConfigSchema>

class FileContentDto {
  @ApiProperty({
    description: 'The content of the uploaded file',
    type: 'string',
    format: 'binary',
  })
  content: Express.Multer.File
}

const filePatchSchema = z
  .object({
    content: z.any(),
  })
  .strict()

export type FilePatchSchema = z.infer<typeof filePatchSchema>

class FileDto extends FileContentDto {
  @ApiProperty({
    description:
      'Filename of the uploaded file, use qg-config.yaml if you upload the main configuration file of the config',
    example: 'qg-config.yaml',
    type: 'string',
  })
  filename: string
}

class FilenameDto extends OmitType(FileDto, ['content']) {}

const filePostSchema = z
  .object({
    filename: z.string().trim().min(1),
  })
  .strict()

const allowedSortProperties = [
  'id',
  'name',
  'creationTime',
  'lastModificationTime',
]

class ConfigsQueryOptions extends PaginationQueryOptions {
  @ApiPropertyOptional({
    description: `Sort configs by the given property, allowed properties are ${allowedSortProperties}`,
    type: 'string',
    example: 'id',
    default: 'id',
  })
  sortBy?: string
}

export class ContentSizeValidator extends FileValidator {
  maxSize: number
  constructor(protected readonly validationOptions: { maxSizeMB: number }) {
    super(validationOptions)
    this.maxSize = validationOptions.maxSizeMB * 1024 * 1024
  }

  isValid(file: FilePatchSchema | ExcelSchema): boolean {
    if (this.maxSize === 0) {
      return true
    }
    if (excelSchema.safeParse(file).success) {
      file = file as ExcelQuestionnaire
      return (
        file.xlsx[0].size <= this.maxSize && file.config[0].size <= this.maxSize
      )
    } else if (filePatchSchema.safeParse(file).success) {
      file = file as FileContentDto
      return file.content[0].size <= this.maxSize
    }
  }

  buildErrorMessage(): string {
    return `The file size exceeds the maximum allowed limit of ${this.validationOptions.maxSizeMB} MB.`
  }
}

export class FileFormatValidator extends FileValidator {
  isValid(file: FilePatchSchema | ExcelSchema): boolean {
    try {
      const utf8Decoder = new TextDecoder('utf-8', { fatal: true })
      if (filePatchSchema.safeParse(file).success) {
        file = file as FileContentDto
        utf8Decoder.decode(file.content[0].buffer)
      }
      return true
    } catch (error) {
      return false
    }
  }

  buildErrorMessage(): string {
    return 'The file is not in UTF-8 format. Please upload a file with UTF-8 encoding.'
  }
}

export const fileSizeCheck = new ParseFilePipe({
  validators: [
    new ContentSizeValidator({
      maxSizeMB: parseInt(MAX_FILE_SIZE_MB),
    }),
  ],
  errorHttpStatusCode: HttpStatus.PAYLOAD_TOO_LARGE,
})

export const fileFormatCheck = new ParseFilePipe({
  validators: [new FileFormatValidator({})],
  errorHttpStatusCode: HttpStatus.BAD_REQUEST,
})

function validateFilename(filename: string): void {
  const filenameReservedRegex = /[\\{}^\%\`"\[\]~<>#|\u0000-\u001F*]/g
  const matches = filename.match(filenameReservedRegex)
  if (matches) {
    throw new BadRequestException(
      `Filename contains reserved characters: ${matches.join(', ')}`
    )
  }
}

@ApiBearerAuth()
@ApiOAuth2(['openid'])
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiForbiddenResponse({ description: 'Forbidden' })
@ApiTags('Configs')
@Controller(':namespaceId/configs')
export class ConfigsController {
  constructor(
    @Inject(ConfigsService) private readonly service: ConfigsService,
    @Inject(UrlHandlerFactory) private readonly urlHandler: UrlHandlerFactory,
    @Inject(YamlValidatorService) private yamlValidator: YamlValidatorService,
    @Inject(JsonValidatorService) private jsonValidator: JsonValidatorService
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Retrieve config resources in the namespace',
  })
  @ApiOkResponse({
    type: ConfigListDto,
    description: 'List of config resources',
  })
  async getConfigs(
    @Param('namespaceId') namespaceId: number,
    @Query() queryOptions: ConfigsQueryOptions,
    @Res({ passthrough: true }) response: Response
  ): Promise<ConfigListDto> {
    validateId(namespaceId)
    const listQueryOptions: ListQueryHandler = toListQueryOptions(
      queryOptions,
      queryOptionsSchema.strict(),
      allowedSortProperties,
      'id'
    )
    const requestUrl = this.urlHandler.getHandler(response)

    const rawData = await this.service.getConfigs(namespaceId, listQueryOptions)
    const data = rawData.entities.map((config: ConfigEntity) =>
      toOutputDto(config, requestUrl.url(`/${config.id}/files`))
    )

    return createPaginationData<ConfigDto, ConfigListDto>(
      listQueryOptions,
      requestUrl,
      rawData.itemCount,
      data
    )
  }

  @Post()
  @ApiOperation({
    summary:
      'Create a new config resource in the namespace, no files associated initially',
  })
  @ApiCreatedResponse({
    type: ConfigDto,
    description: 'Created config resource',
  })
  @ApiBadRequestResponse({ description: 'Constraint violation on input data' })
  @ApiBody({ type: ConfigPostDto })
  async createConfig(
    @Param('namespaceId') namespaceId: number,
    @Body() body: ConfigPostDto,
    @Res({ passthrough: true }) response: Response
  ): Promise<ConfigDto> {
    validateBody(body, postSchema)
    validateId(namespaceId)

    const requestUrl = this.urlHandler.getHandler(response)

    const newConfigEntity = await this.service.create(
      namespaceId,
      body.name,
      body.description
    )
    const newConfig = toOutputDto(
      newConfigEntity,
      requestUrl.url(`/${newConfigEntity.id}/files`)
    )
    response.header('Location', requestUrl.url(`/${newConfig.id}`))
    return newConfig
  }

  @Get(':configId')
  @ApiOperation({ summary: 'Get the requested config resource data' })
  @ApiOkResponse({
    type: ConfigDto,
    description: 'Requested config resource data',
  })
  @ApiNotFoundResponse({ description: 'Resource with given id not found' })
  async getConfig(
    @Param('namespaceId') namespaceId: number,
    @Param('configId') configId: number,
    @Res({ passthrough: true }) response: Response
  ): Promise<ConfigDto> {
    validateId(configId)
    validateId(namespaceId)

    const requestUrl = this.urlHandler.getHandler(response)

    return toOutputDto(
      await this.service.getConfig(namespaceId, configId),
      requestUrl.url('/files')
    )
  }

  @Patch(':configId')
  @ApiOperation({
    summary: 'Update the given config resource',
  })
  @ApiOkResponse({ type: ConfigDto, description: 'Changed config resource' })
  @ApiNotFoundResponse({ description: 'Resource with given id not found' })
  @ApiBadRequestResponse({ description: 'Constraint violation on input data' })
  @ApiBody({ type: ConfigPatchDto })
  async updateConfig(
    @Param('namespaceId') namespaceId: number,
    @Param('configId') configId: number,
    @Body() body: ConfigPatchDto,
    @Res({ passthrough: true }) response: Response
  ): Promise<ConfigDto> {
    validateId(configId)
    validateBody(body, patchSchema)
    validateId(namespaceId)

    const requestUrl = this.urlHandler.getHandler(response)

    return toOutputDto(
      await this.service.update(
        namespaceId,
        configId,
        body.name,
        body.description
      ),
      requestUrl.url('/files')
    )
  }

  @Delete(':configId')
  @ApiOperation({ summary: 'Delete the given config resource' })
  @ApiOkResponse({ description: 'Config resource deleted' })
  @ApiBadRequestResponse({
    description:
      'Not a valid id given or deletion of a config requires all associated runs to be deleted first',
  })
  async deleteConfig(
    @Param('namespaceId') namespaceId: number,
    @Param('configId') configId: number
  ): Promise<void> {
    validateId(configId)
    validateId(namespaceId)

    await this.service.delete(namespaceId, configId)
  }

  @Get(':configId/validate')
  @ApiExcludeEndpoint()
  @ApiOperation({
    summary:
      'Validate the configuration, i.e., validate qg config by checking that all referenced additional configs in the qg config exist and that no non-referenced additional config exists.',
  })
  @ApiOkResponse({
    type: ValidationReport,
    description: 'Validation result including state and findings',
  })
  @ApiNotFoundResponse({ description: 'Resource with given id not found' })
  async validateConfig(
    @Param('namespaceId') namespaceId: number,
    @Param('configId') configId: number,
    @Res({ passthrough: true }) response: Response
  ): Promise<ValidationReport> {
    validateId(configId)
    validateId(namespaceId)

    const requestUrl = this.urlHandler.getHandler(response)

    return {
      ...(await this.service.validate(namespaceId, configId)),
      validated: requestUrl.url('', 1),
    }
  }

  @Patch(':configId/initial-config')
  @ApiOperation({
    summary:
      'Create an initial qg-config file out of a basic questionnaire data format. If there is no prior qg-config file stored, the created file will be stored as qg-config in the config resource. It will not overwrite an existing qg-config file, instead it will store the created config as additional config file with a name qg-config-<x>.yaml.',
  })
  @ApiProduces('application/octet-stream')
  @ApiOkResponse({
    description:
      'The created qg-config file content as application/octet-stream',
  })
  @ApiBadRequestResponse({
    description: 'Given data does not contain necessary information',
  })
  @ApiNotFoundResponse({
    description: 'Config or namespace with given id not found',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: FileContentDto })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'content', maxCount: 1 }]))
  async createInitialConfig(
    @Param('namespaceId') namespaceId: number,
    @Param('configId') configId: number,
    @UploadedFiles(fileSizeCheck, fileFormatCheck) file: FileContentDto,
    @Res({ passthrough: true }) response: Response
  ): Promise<StreamableFile> {
    validateId(configId)
    validateBody(file, filePatchSchema)
    validateId(namespaceId)

    const requestUrl = this.urlHandler.getHandler(response)

    const qgConfig = await this.service.createInitialConfig(
      namespaceId,
      configId,
      file.content[0].buffer
    )
    response.header('Content-Type', 'application/octet-stream')
    response.header(
      'Content-Disposition',
      `attachment; filename="${qgConfig.filename}"`
    )
    response.header(
      'Location',
      requestUrl.url(`/files/${qgConfig.filename}`, 1)
    )

    return new StreamableFile(qgConfig.content)
  }

  @Patch(':configId/config-from-excel')
  @ApiOperation({
    summary:
      'Create an initial qg-config file out of an excel sheet with rows of questions. If there is no prior qg-config file stored, the created file will be stored as qg-config in the config resource. It will not overwrite an existing qg-config file, instead it will store the created config as additional config file with a name qg-config-<x>.yaml.',
  })
  @ApiProduces('application/octet-stream')
  @ApiOkResponse({
    description:
      'The created qg-config file content as application/octet-stream',
  })
  @ApiBadRequestResponse({
    description: 'Given data does not contain necessary information',
  })
  @ApiNotFoundResponse({
    description: 'Config or Namespace with given id not found',
  })
  @ApiBody({ type: ExcelQuestionnaire })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'xlsx', maxCount: 1 },
      { name: 'config', maxCount: 1 },
    ])
  )
  async createInitialConfigFromExcel(
    @Param('namespaceId') namespaceId: number,
    @Param('configId') configId: number,
    @UploadedFiles(fileSizeCheck, fileFormatCheck) files: ExcelQuestionnaire,
    @Res({ passthrough: true }) response: Response
  ): Promise<StreamableFile> {
    validateId(configId)
    validateBody(files, excelSchema)
    validateId(namespaceId)

    const requestUrl = this.urlHandler.getHandler(response)

    const qgConfig = await this.service.createInitialConfigFromExcel(
      namespaceId,
      configId,
      files.xlsx[0].originalname,
      files.xlsx[0].buffer,
      files.config[0].buffer
    )

    response.header('Content-Type', 'application/octet-stream')
    response.header(
      'Content-Disposition',
      `attachment; filename="${qgConfig.filename}"`
    )
    response.header(
      'Location',
      requestUrl.url(`/files/${qgConfig.filename}`, 1)
    )

    return new StreamableFile(qgConfig.content)
  }

  @Post(':configId/copy')
  @ApiOperation({
    summary: 'Create a copy of the given config resource',
  })
  @ApiCreatedResponse({
    type: ConfigDto,
    description: 'Copied config resource',
  })
  @ApiNotFoundResponse({ description: 'Resource with given id not found' })
  async copyConfig(
    @Param('namespaceId') namespaceId: number,
    @Param('configId') configId: number,
    @Body() body: CopyConfigDto,
    @Res({ passthrough: true }) response: Response
  ): Promise<ConfigDto> {
    validateId(configId)
    validateId(namespaceId)
    validateBody(body, copyConfigSchema)

    const requestUrl = this.urlHandler.getHandler(response)

    const coppiedConfig = await this.service.copyConfig(
      namespaceId,
      configId,
      body.name,
      body.description
    )

    const requestUrlWithNewId = requestUrl
      .url('', 1)
      .replace(configId.toString(), coppiedConfig.id.toString())

    return toOutputDto(coppiedConfig, requestUrlWithNewId + '/files')
  }

  @Post(':configId/files')
  @ApiOperation({
    summary:
      'Add a new file to the given config resource. The special file qg-config is identified by filename',
  })
  @ApiCreatedResponse({
    description:
      'The reference to the created file is returned as location header',
  })
  @ApiBadRequestResponse({
    description:
      'When a file with the given filename already exists, use PATCH instead',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: FileDto })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'content', maxCount: 1 }]))
  async addFileToConfig(
    @Param('namespaceId') namespaceId: number,
    @Param('configId') configId: number,
    @Body() body: FilenameDto,
    @UploadedFiles(fileSizeCheck, fileFormatCheck) file: FileContentDto,
    @Res({ passthrough: true }) response: Response
  ): Promise<void> {
    validateId(configId)
    validateBody(body, filePostSchema)
    validateId(namespaceId)

    // File validation applies first, before the file's content gets processed.
    const yamlRegex = /\.ya?ml$/
    const jsonRegex = /\.json$/

    if (yamlRegex.exec(body.filename.toLowerCase())) {
      await this.yamlValidator.validate(file.content[0], body.filename)
    } else if (jsonRegex.exec(body.filename.toLowerCase())) {
      await this.jsonValidator.validate(file.content[0], body.filename)
    }
    const requestUrl = this.urlHandler.getHandler(response)
    let decodedFilename
    try {
      // We need to decode the filename as it may be URL encoded
      decodedFilename = decodeURIComponent(body.filename)
    } catch (error) {
      throw new BadRequestException('Filename is not URL encoded')
    }
    validateFilename(decodedFilename)
    await this.service.createFile(
      namespaceId,
      configId,
      decodedFilename,
      file.content[0].buffer
    )
    const encodedFilename = encodeURIComponent(decodedFilename)
    response.header('Location', requestUrl.url(`/${encodedFilename}`))
  }

  @Get(':configId/files/:filename')
  @ApiOperation({ summary: 'Get the requested file content' })
  @ApiOkResponse({ description: 'File content as application/octet-stream' })
  @ApiNotFoundResponse({ description: 'File with requested name not found' })
  @ApiProduces('application/octet-stream')
  async getFileContent(
    @Param('namespaceId') namespaceId: number,
    @Param('configId') configId: number,
    @Param('filename') filename: string,
    @Res({ passthrough: true }) response: Response
  ): Promise<StreamableFile> {
    validateId(configId)
    validateName(filename)
    validateId(namespaceId)

    const decodedFilename = decodeURIComponent(filename)
    const fileContent = await this.service.getFileContent(
      namespaceId,
      configId,
      decodedFilename
    )
    response.header(
      'Content-Disposition',
      // We are unable to return the decoded filename as it may contain insecure characters that are not allowed to be part of the header
      // That's why we apply to https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition#filename_2
      // We still support the old filename for backward compatibility
      `attachment; filename="${decodedFilename}"; filename*="${filename}"`
    )
    return new StreamableFile(fileContent)
  }

  @Patch(':configId/files/:filename')
  @ApiOperation({ summary: 'Update the file content of the referenced file' })
  @ApiOkResponse({
    description:
      'File content updated successfully, link to file is in location header',
  })
  @ApiNotFoundResponse({ description: 'File with requested name not found' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: FileContentDto })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'content', maxCount: 1 }]))
  async updateFile(
    @Param('namespaceId') namespaceId: number,
    @Param('configId') configId: number,
    @Param('filename') filename: string,
    @UploadedFiles(fileSizeCheck, fileFormatCheck) file: FileContentDto
  ): Promise<void> {
    validateId(configId)
    validateName(filename)
    validateBody(file, filePatchSchema)
    validateId(namespaceId)

    // File validation applies first, before the file's content gets processed.
    const yamlRegex = /\.ya?ml$/
    const jsonRegex = /\.json$/

    if (yamlRegex.exec(filename.toLowerCase())) {
      await this.yamlValidator.validate(file.content[0], filename)
    } else if (jsonRegex.exec(filename.toLowerCase())) {
      await this.jsonValidator.validate(file.content[0], filename)
    }

    const decodedFilename = decodeURIComponent(filename)
    await this.service.updateFile(
      namespaceId,
      configId,
      decodedFilename,
      file.content[0].buffer
    )
  }

  @Delete(':configId/files/:filename')
  @ApiOperation({ summary: 'Delete a file from the given config resource' })
  @ApiOkResponse({ description: 'File removed from config resource' })
  async deleteFile(
    @Param('namespaceId') namespaceId: number,
    @Param('configId') configId: number,
    @Param('filename') filename: string
  ): Promise<void> {
    validateId(configId)
    validateName(filename)
    validateId(namespaceId)

    const decodedFilename = decodeURIComponent(filename)
    await this.service.deleteFile(namespaceId, configId, decodedFilename)
  }
}
