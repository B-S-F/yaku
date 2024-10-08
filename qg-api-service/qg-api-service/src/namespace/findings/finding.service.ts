import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
  Inject,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CreateFindingDTO } from './dto/create-finding.dto'
import { UpdateFindingDTO } from './dto/update-finding.dto'
import { Finding } from './entity/finding.entity'
import { GetFindingDTO } from './dto/get-finding.dto'
import {
  createFindingDto,
  extractFindings,
  generateHash,
} from './utils/functions'
import { RunOverallStatusType } from './utils/enums/runOverallStatusType.enum'
import { StatusType } from './utils/enums/statusType.enum'
import { HashFields } from './utils/interfaces/findingsInterfaces'
import { Run, FindingQgResult } from './utils/interfaces/qgRunMessageInterfaces'
import {
  EntityList,
  FilterOption,
  ListQueryHandler,
  SortOrder,
} from '@B-S-F/api-commons-lib'
import { RunStatus } from '../run/run.entity'
import { CreateMetricDTO } from '../metrics/dto/createMetric.dto'
import { UpdateFindingDTO as UpdateFindingMetricDTO } from '../metrics/dto/updateFinding.dto'
import { ServiceType } from '../metrics/utils/enums/serviceType.enum'
import { MetricService } from '../metrics/metric.service'
import { DELETED_USER, SYSTEM_USER, UsersService } from '../users/users.service'
import { UserInNamespaceDto } from '../users/users.utils'

const allowedFilteringParameters = [
  'configId',
  'runId',
  'status',
  'id',
  'updatedAt',
  'resolver',
]

@Injectable()
export class FindingService {
  private readonly logger = new Logger(FindingService.name)

  constructor(
    @InjectRepository(Finding)
    private findingRepository: Repository<Finding>,
    @Inject(MetricService)
    private readonly metricService: MetricService,
    @Inject(UsersService)
    private readonly usersService: UsersService
  ) {}

  async getAllFindings(
    namespaceIds: number | number[],
    paginateQueryOptions: ListQueryHandler
  ): Promise<EntityList<GetFindingDTO>> {
    let findingsQB = this.findingRepository.createQueryBuilder('findings')
    if (Array.isArray(namespaceIds)) {
      findingsQB = findingsQB.where(
        'findings.namespaceId IN (:...namespaceIds)',
        {
          namespaceIds,
        }
      )
    } else {
      findingsQB = findingsQB.where('findings.namespaceId = (:namespaceIds)', {
        namespaceIds,
      })
    }

    const filters = paginateQueryOptions.additionalParams[
      'filtering'
    ] as FilterOption[]
    if (filters) {
      const unknownFilters = filters
        .filter((cond) => !allowedFilteringParameters.includes(cond.property))
        .map((unknown) => unknown.property)
      if (unknownFilters.length > 0) {
        throw new BadRequestException(
          `Filtering for properties [${unknownFilters}] not supported`
        )
      }
      for (const option of filters) {
        // This switch can be extended if more filtering options appear
        switch (option.property) {
          case 'configId':
            findingsQB.andWhere(`findings.configId IN (:...configIds)`, {
              configIds: option.values,
            })
            break
          case 'runId':
            findingsQB.andWhere(`findings.runId IN (:...runIds)`, {
              runIds: option.values,
            })
            break
          case 'id':
            findingsQB.andWhere(`findings.id IN (:...ids)`, {
              ids: option.values,
            })
            break
          case 'status':
            findingsQB.andWhere(`findings.status IN (:...statuses)`, {
              statuses: option.values,
            })
            break
          case 'updatedAt':
            findingsQB.andWhere(`findings.id IN (:...updatedAt)`, {
              updatedAt: option.values,
            })
            break
          case 'resolver':
            findingsQB.andWhere(`findings.status IN (:...resolvers)`, {
              resolvers: option.values,
            })
            break
          default:
            throw new BadRequestException(
              `Filtering for properties [${unknownFilters}] not supported`
            )
        }
      }
    }
    paginateQueryOptions.addToQueryBuilder<Finding>(findingsQB, 'findings')

    const itemCount = await findingsQB.getCount()
    const findings = await findingsQB.getMany()

    const findingDTOs: GetFindingDTO[] = []
    if (findings) {
      for (const finding of findings) {
        const findingDto = await this.toFindingDtoWithProperResolver(finding)
        findingDTOs.push(findingDto)
      }
    }

    return { itemCount: itemCount, entities: findingDTOs }
  }

  async getFindingById(
    namespaceId: number,
    findingId: string
  ): Promise<GetFindingDTO> {
    const finding = await this.findingRepository
      .createQueryBuilder('findings')
      .where('findings.id = :findingId', { findingId })
      .getOne()

    if (finding) {
      const findingDto = await this.toFindingDtoWithProperResolver(finding)
      return findingDto
    }
    throw new NotFoundException(
      `Finding with id: ${findingId} not found in namespace ${namespaceId}`
    )
  }

  async handleFindingOccurrence(
    namespaceId: number,
    incomingFinding: CreateFindingDTO,
    existingFinding: Finding
  ): Promise<GetFindingDTO> {
    let updateFindingDto: UpdateFindingDTO = {
      occurrenceCount: existingFinding.occurrenceCount + 1,
      runId: incomingFinding.runId,
      runCompletionTime: incomingFinding.runCompletionTime,
      runOverallResult: incomingFinding.runOverallResult,
      runStatus: incomingFinding.runStatus,
      metadata: incomingFinding.metadata,
    }
    if (
      existingFinding.resolver === 'Yaku' ||
      existingFinding.resolver === 'Aqua' ||
      existingFinding.resolver === SYSTEM_USER.id
    )
      updateFindingDto = {
        ...updateFindingDto,
        status: 'unresolved' as StatusType,
        resolvedComment: null,
        resolver: null,
        resolvedDate: null,
      }
    try {
      const result = await this.updateFinding(
        namespaceId,
        existingFinding.id,
        updateFindingDto,
        false
      )
      this.logger.debug(
        `Finding found: ${existingFinding.id}. Increasing number of occurrences.`
      )
      return result
    } catch (error: any) {
      this.logger.debug(
        `Failed to update finding with id: ${existingFinding.id}. Number of occurrences failed to increment`
      )
      throw new NotFoundException(
        `Finding with id: ${existingFinding.id} not found`
      )
    }
  }

  async toFindingDtoWithProperResolver(
    finding: Finding
  ): Promise<GetFindingDTO> {
    const findingDto = new GetFindingDTO(finding)

    const resolver = findingDto.resolver
    if (!resolver) {
      return findingDto
    }

    if (
      resolver === 'Yaku' ||
      resolver === 'Aqua' ||
      resolver === SYSTEM_USER.id
    ) {
      findingDto.resolvedManually = false
      findingDto.resolver = SYSTEM_USER
    } else {
      findingDto.resolvedManually = true
      const resolverToGet =
        resolver instanceof UserInNamespaceDto ? resolver.id : resolver
      const user = await this.usersService.getUser(resolverToGet)
      findingDto.resolver = user
    }

    return findingDto
  }

  async processFindings(run: Run, result: any) {
    if (run.status == 'completed') {
      try {
        const resultData: any[] = extractFindings(result)

        await this.checkFindingsForOccurrences(run, resultData)
      } catch (error) {
        this.logger.log(
          `Processing of Findings failed at run with id: ${run.id} due to ${error.message}`
        )
      }

      try {
        await this.createRunMetrics(run)
      } catch (error) {
        this.logger.log(
          `Propagating Metrics failed at run with id: ${run.id} to tue ${error.me}`
        )
      }
    } else
      this.logger.log(
        `Findings and Metrics of the run: ${run.id} will not be processed due to run incomplete status`
      )
  }

  async checkFindingsForOccurrences(runData: Run, resultData: any) {
    let page = 1
    const items = 100
    let findingsBeforeConsumption: GetFindingDTO[] = []
    let receivedFindings: GetFindingDTO[] = []
    const sort = 'DESC' as SortOrder
    do {
      const listQH = new ListQueryHandler(page, items, sort, 'runId')
      listQH.additionalParams = {
        filtering: [
          {
            property: 'configId',
            values: [runData.configId.toString()],
          },
        ],
      }
      receivedFindings = (
        await this.getAllFindings(runData.namespaceId, listQH)
      ).entities
      findingsBeforeConsumption =
        findingsBeforeConsumption.concat(receivedFindings)
      page += 1
    } while (receivedFindings.length > 0)
    const dictionaryBefore = Object.assign(
      {},
      ...findingsBeforeConsumption.map((element) => ({
        [element.uniqueIdHash]: element,
      }))
    )
    const hashSet = new Set<string>()

    for (const result of resultData) {
      const findingQgResult: FindingQgResult = {
        chapter: result.chapter,
        requirement: result.requirement,
        check: result.check,
        criterion: result.criterion,
        justification: result.justification,
        metadata: result.metadata,
      }
      const findingDto: CreateFindingDTO = createFindingDto(
        runData,
        findingQgResult
      )

      // Generate the SHA256 hash
      const hashData: HashFields = {
        ...findingDto,
        namespaceId: runData.namespaceId,
      }
      const hash = generateHash(hashData)

      if (!hashSet.has(hash)) {
        try {
          await this.createFinding(runData.namespaceId, findingDto, hash)
          hashSet.add(hash)
        } catch (error: any) {
          // Handle specific error if needed
          if (error instanceof NotFoundException)
            this.logger.error(`Error updating finding: ${error.message}`)
          else this.logger.error(`Error creating finding: ${error.message}`)
        }
      }
    }
    page = 1
    let findingsAfterConsumption: GetFindingDTO[] = []
    receivedFindings = []
    do {
      const listQH = new ListQueryHandler(page, items, sort, 'runId')
      listQH.additionalParams = {
        filtering: [
          {
            property: 'configId',
            values: [runData.configId.toString()],
          },
        ],
      }
      receivedFindings = (
        await this.getAllFindings(runData.namespaceId, listQH)
      ).entities
      findingsAfterConsumption =
        findingsAfterConsumption.concat(receivedFindings)
      page += 1
    } while (receivedFindings.length > 0)
    const dictionaryAfter = Object.assign(
      {},
      ...findingsAfterConsumption.map((element) => ({
        [element.uniqueIdHash]: element,
      }))
    )
    await this.resolveFindings(dictionaryBefore, dictionaryAfter, runData)
  }

  async resolveFindings(
    findingsBeforeConsumption: any,
    findingsAfterConsumption: any,
    lastRun: Run
  ): Promise<void> {
    for (const key in findingsBeforeConsumption) {
      if (
        findingsAfterConsumption[key].status == 'unresolved' &&
        findingsBeforeConsumption[key].occurrenceCount ==
          findingsAfterConsumption[key].occurrenceCount
      ) {
        const updateFindingDto: UpdateFindingDTO = {
          status: 'resolved' as StatusType,
          resolvedComment: `This finding was automatically resolved by run ${lastRun.id}`,
          resolver: SYSTEM_USER.id,
          runId: lastRun.id,
          runCompletionTime: lastRun.completionTime,
          runOverallResult: lastRun.overallResult as RunOverallStatusType,
          runStatus: lastRun.status as RunStatus,
        }
        try {
          this.logger.debug(
            `Attempting to automatically resolve finding: ${findingsBeforeConsumption[key].id}.`
          )
          await this.updateFinding(
            findingsBeforeConsumption[key].namespaceId,
            findingsBeforeConsumption[key].id,
            updateFindingDto,
            false
          )
        } catch (error) {
          this.logger.error(
            `Error while automatically resolving finding: ${error.message}`
          )
          throw new Error(
            `Error while automatically resolving findings: ${error.message}`
          )
        }
      }
    }
  }

  async createFinding(
    namespaceId: number,
    createFindingDto: CreateFindingDTO,
    hash: string
  ): Promise<GetFindingDTO> {
    if (createFindingDto.resolver !== undefined) {
      throw new Error(
        'Invariant violated: Newly created finding has a resolver but should not.'
      )
    }

    // Validate if the hash is unique
    const existingFinding = await this.findingRepository
      .createQueryBuilder('findings')
      .where('findings.namespaceId = :namespaceId', { namespaceId })
      .andWhere('findings.uniqueIdHash = :hash', { hash })
      .getOne()
    if (existingFinding) {
      try {
        return await this.handleFindingOccurrence(
          namespaceId,
          createFindingDto,
          existingFinding
        )
      } catch (error: any) {
        throw new Error(
          `Failed to handle the existing findings due to: ${error.message}`
        )
      }
    } else {
      // Assign the hash to the uniqueIdHash field in the DTO
      this.logger.debug(`New finding found. Proceed with creation.`)
      const createFindingDtoWithHash = {
        ...createFindingDto,
        namespaceId: namespaceId,
        uniqueIdHash: hash,
      }
      const finding = this.findingRepository.create(createFindingDtoWithHash)
      const newFinding = await this.findingRepository.save(finding)
      const newFindingDto = new GetFindingDTO(newFinding)

      return newFindingDto
    }
  }

  async updateFinding(
    namespaceId: number,
    findingId: string,
    updateFindingDto: UpdateFindingDTO,
    propagateMetrics = true
  ): Promise<GetFindingDTO> {
    if (updateFindingDto.status === 'resolved') {
      if (!updateFindingDto.resolver) {
        throw new BadRequestException(
          'Resolver cannot be null if the status will be changed to resolved'
        )
      }
      updateFindingDto.resolvedDate = new Date().toISOString()
    }
    if (updateFindingDto.resolver) {
      if (
        updateFindingDto.resolver === 'Yaku' ||
        updateFindingDto.resolver === 'Aqua' ||
        updateFindingDto.resolver === SYSTEM_USER.id
      ) {
        updateFindingDto.resolver = SYSTEM_USER.id
      } else {
        const user = await this.usersService.getUser(updateFindingDto.resolver)
        if (user.id === DELETED_USER.id) {
          throw new BadRequestException(
            `Resolver does not exist, resolver ${updateFindingDto.resolver}`
          )
        }
        updateFindingDto.resolver = user.id
      }
    }
    const updatedFinding = await this.findingRepository.update(
      {
        id: findingId,
        namespaceId: namespaceId,
      },
      updateFindingDto
    )

    if (!updatedFinding.affected) {
      throw new NotFoundException(
        `Finding with id: ${findingId} not found in namespace ${namespaceId}`
      )
    }
    const finding = await this.findingRepository.findOneBy({ id: findingId })
    if (finding) {
      const findingDto = await this.toFindingDtoWithProperResolver(finding)
      if (propagateMetrics) {
        const updateMetricDTO = new UpdateFindingMetricDTO()
        updateMetricDTO.namespaceId = namespaceId
        updateMetricDTO.configId = finding.configId
        updateMetricDTO.runId = finding.runId
        updateMetricDTO.status = finding.status
        updateMetricDTO.severity = 'severity?' as any
        updateMetricDTO.updated = finding.updatedAt
        await this.metricService.updateFindingMetric(
          namespaceId,
          findingId,
          updateMetricDTO
        )
      }

      return findingDto
    }
  }

  async deleteFinding(namespaceId: number, findingId: string) {
    const deletedFinding = await this.findingRepository.delete({
      id: findingId,
      namespaceId: namespaceId,
    })
    if (!deletedFinding.affected) {
      throw new HttpException(
        `Finding with id: ${findingId} was not found in namespace ${namespaceId}`,
        HttpStatus.NOT_FOUND
      )
    }
    return { deleted: true }
  }

  async deleteAssociatedFindings(namespaceId: number, configId: number) {
    let page = 1
    const items = 100
    let resultFindings: GetFindingDTO[] = []
    let receivedFindings: GetFindingDTO[] = []
    const sort = 'DESC' as SortOrder
    do {
      const listQH = new ListQueryHandler(page, items, sort, 'runId')
      listQH.additionalParams = {
        filtering: [
          {
            property: 'configId',
            values: [configId.toString()],
          },
        ],
      }
      receivedFindings = (await this.getAllFindings(namespaceId, listQH))
        .entities
      resultFindings = resultFindings.concat(receivedFindings)
      page += 1
    } while (receivedFindings.length > 0)

    for (const finding of resultFindings) {
      if (finding.configId == configId) {
        const { id } = finding
        try {
          this.logger.log(
            `Attempting to delete finding with id: ${id} from namespace with namespaceId: ${namespaceId}`
          )
          await this.deleteFinding(namespaceId, id)
          this.logger.log(`Successful delete`)
        } catch (error) {
          throw new Error(
            `Failed to delete finding with id: ${id} from namespace with namespaceId: ${namespaceId} due to ${error.message}`
          )
        }
      }
    }
  }

  private async createRunMetrics(run: Run) {
    let page = 1
    const items = 100
    let totalfindings: GetFindingDTO[] = []
    let pagedFindings: GetFindingDTO[] = []

    do {
      const listQH = new ListQueryHandler(page, items, SortOrder.DESC, 'runId')
      listQH.additionalParams = {
        filtering: [
          {
            property: 'configId',
            values: [run.configId.toString()],
          },
        ],
      }
      pagedFindings = (await this.getAllFindings(run.namespaceId, listQH))
        .entities
      totalfindings = totalfindings.concat(pagedFindings)

      page += 1
    } while (pagedFindings.length > 0)

    for (const findingDto of totalfindings) {
      const findingMetric = new CreateMetricDTO()
      findingMetric.service = ServiceType.FINDINGS
      findingMetric.metric = {
        id: findingDto.id,
        status: findingDto.status,
        severity: 'severity?',
        namespaceId: run.namespaceId,
        configId: run.configId,
        runId: run.id,
        updated: findingDto.updatedAt,
      }
      await this.metricService.create(findingMetric)
    }
  }
}
