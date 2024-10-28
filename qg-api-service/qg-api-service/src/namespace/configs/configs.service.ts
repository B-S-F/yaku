import {
  EntityList,
  ListQueryHandler,
  decodeBufferToUTF8EncodedString,
} from '@B-S-F/api-commons-lib'
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import {
  DeepPartial,
  In,
  QueryFailedError,
  QueryRunner,
  Repository,
} from 'typeorm'
import { FindingService } from '../findings/finding.service'
import { NamespaceLocalIdService } from '../namespace/namespace-local-id.service'
import { NamespaceCreated } from '../namespace/namespace.service'
import { ConfigEntity, FileContentEntity, FileEntity } from './config.entity'
import { ExcelTransformerService } from './excel-transformer.service'
import { GeneratorService, Questionnaire } from './generator.service'

@Injectable()
export class ConfigsService {
  constructor(
    @InjectRepository(ConfigEntity)
    private readonly repository: Repository<ConfigEntity>,
    @InjectRepository(FileEntity)
    private readonly fileRepo: Repository<FileEntity>,
    @InjectRepository(FileContentEntity)
    private readonly fileContentRepo: Repository<FileContentEntity>,
    @Inject(NamespaceLocalIdService)
    private readonly idService: NamespaceLocalIdService,
    @Inject(GeneratorService)
    private readonly generationService: GeneratorService,
    @Inject(ExcelTransformerService)
    private readonly excelReaderService: ExcelTransformerService,
    @Inject(FindingService)
    private readonly findingService: FindingService
  ) {}

  async getConfigs(
    namespaceId: number,
    listQueryHandler: ListQueryHandler
  ): Promise<EntityList<ConfigEntity>> {
    const queryBuilder = this.repository
      .createQueryBuilder('configs')
      .leftJoinAndSelect('configs.namespace', 'Namespace')
      .leftJoinAndSelect('configs.files', 'FileEntity')
      .where('configs.namespace.id = :namespaceId', { namespaceId })

    listQueryHandler.addToQueryBuilder<ConfigEntity>(queryBuilder, 'configs')

    const itemCount = await queryBuilder.getCount()
    const { entities } = await queryBuilder.getRawAndEntities()

    return { itemCount, entities }
  }

  async getConfig(
    namespaceId: number,
    configId: number
  ): Promise<ConfigEntity> {
    return this.getConfigObject(namespaceId, configId)
  }

  async create(
    namespaceId: number,
    name: string,
    description: string
  ): Promise<ConfigEntity> {
    if (!name || !name.trim()) {
      throw new BadRequestException('Name needed for a config object')
    }
    const nowDate = new Date()
    const config: DeepPartial<ConfigEntity> = {
      name: name,
      description: description?.trim() ?? null,
      namespace: { id: namespaceId },
      creationTime: nowDate,
      lastModificationTime: nowDate,
    }
    config.id = await this.idService.nextId(ConfigEntity.name, namespaceId)
    const newItem = this.repository.create(config)
    return this.repository.save(newItem)
  }

  async update(
    namespaceId: number,
    configId: number,
    name: string,
    description: string | null
  ): Promise<ConfigEntity> {
    const config = await this.getConfigObject(namespaceId, configId)
    const changedConfig: DeepPartial<ConfigEntity> = {
      globalId: config.globalId,
      lastModificationTime: new Date(),
    }
    changedConfig.name = name ?? config.name
    if (description) {
      changedConfig.description = description
    } else if (description === '' || description === null) {
      changedConfig.description = null
    } else {
      changedConfig.description = config.description
    }
    await this.repository.update({ globalId: config.globalId }, changedConfig)
    const result = await this.repository.save(changedConfig)
    // save does not resolve properly the entity, we correct that with the next statements
    const resultConfig = new ConfigEntity()
    resultConfig.globalId = config.globalId
    resultConfig.namespace = config.namespace
    resultConfig.id = config.id
    resultConfig.name = result.name
    resultConfig.description = result.description
    resultConfig.creationTime = config.creationTime
    resultConfig.lastModificationTime = result.lastModificationTime
    resultConfig.files = config.files
    return resultConfig
  }

  private async updateConfigModificationTime(
    namespaceId: number,
    configId: number
  ): Promise<void> {
    const config = await this.getConfigObject(namespaceId, configId)
    const changedConfig: DeepPartial<ConfigEntity> = {
      globalId: config.globalId,
      id: config.id,
      name: config.name,
      description: config.description,
      namespace: config.namespace,
      creationTime: config.creationTime,
      lastModificationTime: new Date(),
    }
    await this.repository.update({ globalId: config.globalId }, changedConfig)
    await this.repository.save(changedConfig)
  }

  async delete(namespaceId: number, configId: number): Promise<void> {
    try {
      await this.repository.delete({
        namespace: { id: namespaceId },
        id: configId,
      })
      this.findingService.deleteAssociatedFindings(namespaceId, configId)
    } catch (err) {
      if (
        err instanceof QueryFailedError &&
        err.message.includes('violates foreign key constraint')
      ) {
        throw new BadRequestException(
          `There are still runs or releases associated to config with id ${configId}, delete them first`
        )
      }
      throw err
    }
  }

  async validate(
    namespaceId: number,
    configId: number
  ): Promise<{ status: any; findings: string[] }> {
    throw new NotImplementedException('Validation not implemented.')
  }

  async createInitialConfig(
    namespaceId: number,
    configId: number,
    questionnaire: Buffer
  ): Promise<{ filename: string; content: Buffer }> {
    return this.createConfigFromQuestionnaire(
      namespaceId,
      configId,
      questionnaire
    )
  }

  async createInitialConfigFromExcel(
    namespaceId: number,
    configId: number,
    excelFileName: string,
    excelFileContent: Buffer,
    configFileContent: Buffer
  ): Promise<{ filename: string; content: Buffer }> {
    const questionnaire =
      this.excelReaderService.transformExcelToQuestionnaireData(
        excelFileName,
        excelFileContent,
        configFileContent
      )
    return this.createConfigFromQuestionnaire(
      namespaceId,
      configId,
      questionnaire
    )
  }

  private async createConfigFromQuestionnaire(
    namespaceId: number,
    configId: number,
    questionnaire: Buffer | Questionnaire
  ): Promise<{ filename: string; content: Buffer }> {
    const qgConfig = Buffer.from(
      this.generationService.generateInitialConfig(questionnaire)
    )

    const filename = await this.storeConfig(namespaceId, configId, qgConfig)
    await this.updateConfigModificationTime(namespaceId, configId)
    return { filename, content: qgConfig }
  }

  private async storeConfig(
    namespaceId: number,
    configId: number,
    content: Buffer
  ): Promise<string> {
    const config = await this.getConfig(namespaceId, configId)
    const findInFiles = (filename: string) =>
      config.files.find((file) => file.filename === filename)
    let name = 'qg-config.yaml'
    if (!findInFiles(name)) {
      await this.createFile(namespaceId, configId, name, content)
      return name
    } else {
      let counter = 1
      do {
        name = `qg-config-${counter}.yaml`
        if (!findInFiles(name)) {
          await this.createFile(namespaceId, configId, name, content)
          return name
        }
        counter++
      } while (true)
    }
  }

  async createFile(
    namespaceId: number,
    configId: number,
    filename: string,
    content: Buffer
  ): Promise<void> {
    const dataString = decodeBufferToUTF8EncodedString(content)
    if (!dataString || !dataString.trim()) {
      throw new BadRequestException('File content empty or not utf-8 encoded')
    }

    const existingFile = await this.getFileEntity(
      namespaceId,
      configId,
      filename
    )
    if (existingFile) {
      throw new BadRequestException(
        `File with name "${filename}" already exists`
      )
    }

    const fileData: DeepPartial<FileEntity> = {
      filename,
      config: await this.getConfig(namespaceId, configId),
    }
    const file = this.fileRepo.create(fileData)
    await this.fileRepo.save(file)

    const fileContentData: DeepPartial<FileContentEntity> = {
      content: dataString,
      file,
    }
    const fileContent = this.fileContentRepo.create(fileContentData)
    await this.fileContentRepo.save(fileContent)
    await this.updateConfigModificationTime(namespaceId, configId)
  }

  async getFileContent(
    namespaceId: number,
    configId: number,
    filename: string
  ): Promise<Buffer> {
    const content = await this.getFileContentEntity(
      namespaceId,
      configId,
      filename
    )
    if (!content) {
      throw new NotFoundException('File not found')
    }
    return Buffer.from(content.content, 'utf-8')
  }

  async getContentOfMultipleFiles(
    namespaceId: number,
    configId: number,
    filenames: string[]
  ): Promise<{ [filename: string]: string }> {
    const contentList = await this.fileContentRepo.find({
      where: {
        file: {
          config: { namespace: { id: namespaceId }, id: configId },
          filename: In(filenames),
        },
      },
      relations: {
        file: true,
      },
    })
    const contentMapping: { [filename: string]: string } = {}
    contentList.forEach((contentObj) => {
      contentMapping[contentObj.file.filename] = contentObj.content
    })
    return contentMapping
  }

  async updateFile(
    namespaceId: number,
    configId: number,
    filename: string,
    content: Buffer
  ): Promise<void> {
    const fileContent = await this.getFileContentEntity(
      namespaceId,
      configId,
      filename
    )
    if (!fileContent) {
      throw new NotFoundException('File not found')
    }

    const newContent = decodeBufferToUTF8EncodedString(content)
    if (!newContent) {
      throw new BadRequestException(
        'File content either empty or not utf-8 encoded'
      )
    }
    fileContent.content = newContent
    await this.fileContentRepo.update({ id: fileContent.id }, fileContent)
    await this.fileContentRepo.save(fileContent)
    await this.updateConfigModificationTime(namespaceId, configId)
  }

  async deleteFile(
    namespaceId: number,
    configId: number,
    filename: string
  ): Promise<void> {
    try {
      const config = await this.getConfigObject(namespaceId, configId)
      await this.fileRepo.delete({
        config: { globalId: config.globalId },
        filename,
      })
      await this.updateConfigModificationTime(namespaceId, configId)
    } catch (err) {
      if (!(err instanceof NotFoundException)) {
        throw err
      }
      // Silently accept that nothing needs to be deleted
    }
  }

  getNamespaceCreatedCallback(): NamespaceCreated {
    return (namespaceId: number) =>
      this.idService.initializeIdCreation(ConfigEntity.name, namespaceId)
  }

  private async getConfigObject(
    namespaceId: number,
    configId: number
  ): Promise<ConfigEntity> {
    if (!namespaceId || namespaceId <= 0) {
      throw new BadRequestException('Missing proper namespace id')
    }
    if (!configId || configId <= 0) {
      throw new BadRequestException('Missing proper config id')
    }

    const config = await this.repository.findOne({
      where: {
        namespace: { id: namespaceId },
        id: configId,
      },
      relations: ['files'],
    })
    if (!config) {
      throw new NotFoundException('Requested config not found')
    }
    return config
  }

  private async getFileEntity(
    namespaceId: number,
    configId: number,
    filename: string
  ): Promise<FileEntity> {
    return this.fileRepo.findOneBy({
      config: { namespace: { id: namespaceId }, id: configId },
      filename,
    })
  }

  private async getFileContentEntity(
    namespaceId: number,
    configId: number,
    filename: string
  ): Promise<FileContentEntity> {
    return this.fileContentRepo.findOneBy({
      file: {
        config: { namespace: { id: namespaceId }, id: configId },
        filename: filename,
      },
    })
  }

  async copyConfig(
    namespaceId: number,
    configId: number,
    name: string,
    description?: string
  ): Promise<ConfigEntity> {
    const querryRunner = this.repository.manager.connection.createQueryRunner()
    await querryRunner.connect()
    await querryRunner.startTransaction('READ COMMITTED')
    try {
      const copiedConfig = await this.copyConfigWithTransaction(
        querryRunner,
        namespaceId,
        configId,
        name,
        description
      )
      await querryRunner.commitTransaction()
      return copiedConfig
    } catch (error) {
      await querryRunner.rollbackTransaction()
      throw error
    } finally {
      await querryRunner.release()
    }
  }

  async copyConfigWithTransaction(
    queryRunner: QueryRunner,
    namespaceId: number,
    configId: number,
    name: string,
    description?: string
  ): Promise<ConfigEntity> {
    // TODO: As soon as we refactor the configs service to use transactions, we can reduce duplicate code in this method
    const configToCopy = await queryRunner.manager.findOne(ConfigEntity, {
      where: { id: configId, namespace: { id: namespaceId } },
      relations: ['files'],
    })

    if (!configToCopy) {
      throw new NotFoundException('Requested config not found')
    }

    if (description === undefined) {
      description = (await configToCopy).description
    }

    // TODO: idService is not using transactions!
    const id = await this.idService.nextId(ConfigEntity.name, namespaceId)
    const newConfig = await queryRunner.manager.create(ConfigEntity, {
      id,
      name,
      description,
      namespace: { id: namespaceId },
      creationTime: new Date(),
      lastModificationTime: new Date(),
    })

    await queryRunner.manager.save(newConfig)

    for (const fileToCopy of configToCopy.files) {
      const newFile = await queryRunner.manager.create(FileEntity, {
        filename: fileToCopy.filename,
        config: newConfig,
      })

      await queryRunner.manager.save(newFile)

      const fileContentToCopy = await queryRunner.manager.findOne(
        FileContentEntity,
        {
          where: {
            file: {
              config: { namespace: { id: namespaceId }, id: configId },
              filename: fileToCopy.filename,
            },
          },
        }
      )

      if (!fileContentToCopy) {
        throw new InternalServerErrorException(
          `Implementation error: File content for file ${fileToCopy.filename} not found`
        )
      }

      const newFileContent = await queryRunner.manager.create(
        FileContentEntity,
        {
          content: fileContentToCopy.content,
          file: newFile,
        }
      )

      await queryRunner.manager.save(newFileContent)
    }

    return queryRunner.manager.findOne(ConfigEntity, {
      where: { id: newConfig.id, namespace: { id: namespaceId } },
      relations: ['files'],
    })
  }
}
