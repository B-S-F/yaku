// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import {
  EntityList,
  FilterOption,
  ListQueryHandler,
} from '@B-S-F/api-commons-lib'
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { randomUUID } from 'crypto'
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino'
import { Readable } from 'stream'
import { DeepPartial, QueryRunner, Repository } from 'typeorm'
import { promiseOnTime } from '../../gp-services/promise-utils'
import { Action, AuditActor } from '../audit/audit.entity'
import { ConfigsService } from '../configs/configs.service'
import { RequestUser } from '../module.utils'
import { NamespaceLocalIdService } from '../namespace/namespace-local-id.service'
import { NamespaceCreated } from '../namespace/namespace.service'
import {
  WorkflowManager,
  WorkflowOptions,
} from '../workflow/workflow-argo.service'
import { Run, RunAuditService, RunStatus } from './run.entity'

export const RESULTFILE = 'qg-result.yaml'
export const EVIDENCEFILE = 'evidences.zip'

const allowedFilteringParameters = ['config', 'latestOnly']

@Injectable()
export class RunService {
  @InjectPinoLogger(RunService.name)
  private readonly logger = new PinoLogger({
    pinoHttp: {
      level: 'trace',
      serializers: {
        req: () => undefined,
        res: () => undefined,
      },
    },
  })

  constructor(
    @InjectRepository(Run) private readonly repository: Repository<Run>,
    @Inject(WorkflowManager)
    private readonly workflowDispatcher: WorkflowManager,
    @Inject(ConfigsService) private readonly configService: ConfigsService,
    @Inject(NamespaceLocalIdService)
    private readonly idService: NamespaceLocalIdService,
    @Inject(RunAuditService)
    private readonly auditService: RunAuditService,
  ) {}

  async getList(
    namespaceId: number,
    listQueryHandler: ListQueryHandler,
  ): Promise<EntityList<Run>> {
    const queryBuilder = this.repository
      .createQueryBuilder('runs')
      .leftJoinAndSelect('runs.config', 'ConfigEntity')
      .leftJoinAndSelect('runs.namespace', 'Namespace')
      .where('runs.namespaceId = :namespaceId', { namespaceId })

    const filters = listQueryHandler.additionalParams[
      'filtering'
    ] as FilterOption[]
    if (filters) {
      const unknowns = filters
        .filter((cond) => !allowedFilteringParameters.includes(cond.property))
        .map((unknown) => unknown.property)
      if (unknowns.length > 0) {
        throw new BadRequestException(
          `Filtering for properties [${unknowns}] not supported`,
        )
      }
      for (const option of filters) {
        if (option.property === 'config') {
          queryBuilder.andWhere('ConfigEntity.id IN (:...cids)', {
            cids: option.values,
          })
        }
        if (option.property === 'latestOnly') {
          if (option.values.length !== 1 || option.values[0] !== 'true') {
            throw new BadRequestException(
              'Filter option latestOnly has to be used like this latestOnly=true',
            )
          }
          const subQuery = this.repository
            .createQueryBuilder('run')
            .select(['MAX(run.globalId)'])
            .where('run.namespaceId = :namespaceId', { namespaceId })
            .groupBy('run.configGlobalId')
            .getQuery()

          queryBuilder.andWhere(`runs.globalId IN (${subQuery})`)
        }
      }
    }

    listQueryHandler.addToQueryBuilder<Run>(queryBuilder, 'runs')

    const itemCount = await queryBuilder.getCount()
    const { entities } = await queryBuilder.getRawAndEntities()

    return { itemCount, entities }
  }

  async get(namespaceId: number, runId: number): Promise<Run> {
    const queryRunner = this.repository.manager.connection.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction('READ COMMITTED')
    try {
      let run = await this.getWithTransaction(queryRunner, namespaceId, runId)

      if (!run) {
        throw new NotFoundException(`Run with id ${runId} not found`)
      }
      if (run.status === RunStatus.Running) {
        this.logger.trace({
          msg: `Start check whether run ${namespaceId}:${runId} has been finished`,
        })
        run = await this.checkAndUpdateRun(run)
        this.logger.trace({
          msg: `End check whether run ${namespaceId}:${runId} has been finished`,
        })
      }
      await queryRunner.commitTransaction()

      return run
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw e
    } finally {
      await queryRunner.release()
    }
  }

  async getWithTransaction(
    queryRunner: QueryRunner,
    namespaceId: number,
    runId: number
  ): Promise<Run> {
    return await queryRunner.manager.findOne(Run, {
      where: {
        namespace: { id: namespaceId },
        id: runId,
      },
      relations: ['config', 'namespace'],
    })
  }

  async checkAndUpdateRun(run: Run): Promise<Run> {
    const originalRun = structuredClone(run)
    try {
      if (run.argoId && run.argoName && run.argoNamespace) {
        run = await promiseOnTime(
          this.workflowDispatcher.updateRunIfFinished(run),
          2000
        )
      }
    } catch (err) {
      run = originalRun
      this.logger.warn(
        `Could not check workflow state for run ${run.globalId} (${run.namespace.id}:${run.id}), error was ${err}`
      )
    }
    return run
  }

  async create(
    namespaceId: number,
    configId: number,
    actor: RequestUser,
    options: WorkflowOptions = { environment: {} },
  ): Promise<Run> {
    const createRunStartTime = Date.now()
    const queryRunner = this.repository.manager.connection.createQueryRunner()

    try {
      await queryRunner.connect()
      await queryRunner.startTransaction('READ UNCOMMITTED')

      const run = await this.createWithTransaction(
        queryRunner,
        namespaceId,
        configId,
        actor
      )
      await queryRunner.commitTransaction()
      await queryRunner.release()
      this.workflowDispatcher.run(run, options)
      return run
    } catch (err) {
      this.logger.error({
        msg: `Error while creating run: ${err}`,
      })
      await queryRunner.rollbackTransaction()
      await queryRunner.release()
      throw err
    } finally {
      this.logger.debug(
        `POST /runs: Store initial run took: ${
          Date.now() - createRunStartTime
        }ms`,
      )
    }
  }

  async createWithTransaction(
    queryRunner: QueryRunner,
    namespaceId: number,
    configId: number,
    actor: RequestUser
  ): Promise<Run> {
    const config = await this.configService.getConfig(namespaceId, configId)

    const storagePath = randomUUID()
    const runData: DeepPartial<Run> = {
      config,
      namespace: { id: namespaceId },
      storagePath,
      status: RunStatus.Pending,
      creationTime: new Date(),
      id: await this.idService.nextId(Run.name, namespaceId),
    }

    const createdRun = queryRunner.manager.create(Run, runData)
    const run = await queryRunner.manager.save(Run, createdRun)

    await this.auditService.append(
      namespaceId,
      run.id,
      {},
      run,
      AuditActor.convertFrom(actor),
      Action.CREATE,
      queryRunner.manager
    )

    return run
  }

  async getResult(namespaceId: number, runId: number): Promise<Readable> {
    return this.downloadResult(namespaceId, runId, RESULTFILE)
  }

  async getEvidence(namespaceId: number, runId: number): Promise<Readable> {
    return this.downloadResult(namespaceId, runId, EVIDENCEFILE)
  }

  private async downloadResult(
    namespaceId: number,
    runId: number,
    filename: string,
  ): Promise<Readable> {
    const run = await this.get(namespaceId, runId)

    if (run.status !== RunStatus.Completed) {
      throw new BadRequestException(
        `Run with id ${runId} has not finished or has failed`,
      )
    }
    return this.workflowDispatcher.downloadResult(run.storagePath, filename)
  }

  async delete(
    namespaceId: number,
    runId: number,
    actor: RequestUser,
  ): Promise<void> {
    const queryRunner = this.repository.manager.connection.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction('READ UNCOMMITTED')
      await this.deleteWithTransaction(namespaceId, runId, actor, queryRunner)
      await queryRunner.commitTransaction()
    } catch (err) {
      this.logger.error({
        msg: `Error while deleting run: ${err}`,
      })
      await queryRunner.rollbackTransaction()
      throw err
    } finally {
      await queryRunner.release()
    }
  }

  async deleteWithTransaction(
    namespaceId: number,
    runId: number,
    actor: RequestUser,
    queryRunner: QueryRunner,
  ): Promise<void> {
    try {
      const run = await this.get(namespaceId, runId)
      if (run.status !== RunStatus.Running) {
        await this.workflowDispatcher.deleteWorkflowArtifacts(run)
        await queryRunner.manager.remove(run)
        await this.auditService.append(
          namespaceId,
          runId,
          {},
          run,
          AuditActor.convertFrom(actor),
          Action.DELETE,
          queryRunner.manager,
        )
      } else {
        throw new BadRequestException(
          `Run ${runId} cannot be deleted while workflow is still executed.`,
        )
      }
    } catch (err) {
      if (!(err instanceof NotFoundException)) {
        throw err
      }
      // Not Found can happen and has no consequence
    }
  }

  getNamespaceCreatedCallback(): NamespaceCreated {
    return (namespaceId: number) =>
      this.idService.initializeIdCreation(Run.name, namespaceId)
  }
}
