import { ListQueryHandler, SortOrder } from '@B-S-F/api-commons-lib'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { Timeout } from '@nestjs/schedule'
import { ConfigEntity } from '../configs/config.entity'
import { ConfigsService } from '../configs/configs.service'
import { Run } from './run.entity'
import { RunService } from './run.service'
import { SYSTEM_REQUEST_USER } from '../module.utils'

@Injectable()
export class CleanTestDataConfig {
  constructor(
    readonly executeTestDataCleanup: boolean,
    readonly testdataNamespaceString: string,
    readonly retentionPeriodInDays: string
  ) {
    const logger = new Logger(CleanTestDataConfig.name)
  }
}

type ConfigSet = { [id: string]: ConfigEntity }
type DeleteableObjectRef = { namespaceId: number; id: number }
type DeleteableObjects = {
  configs: DeleteableObjectRef[]
  runs: DeleteableObjectRef[]
}

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000
@Injectable()
export class CleanTestDataTask {
  private readonly logger = new Logger(CleanTestDataTask.name)
  private readonly today = new Date()
  private readonly retentionPeriod: number

  constructor(
    @Inject(RunService) private readonly runService: RunService,
    @Inject(ConfigsService) private readonly configService: ConfigsService,
    @Inject(CleanTestDataConfig) private readonly config: CleanTestDataConfig
  ) {
    this.retentionPeriod =
      parseInt(this.config.retentionPeriodInDays) * MILLISECONDS_PER_DAY
  }

  @Timeout(15000)
  async cleanUpTestData(): Promise<void> {
    try {
      if (this.config.executeTestDataCleanup) {
        this.logger.log('Execute clean up of testdata')
        const deleteableObjects = await this.identifyDeleteableObjects(
          this.parseNamespaceString()
        )
        await this.deleteObjects(deleteableObjects)
        this.logger.debug('Finished clean up of testdata')
      }
    } catch (err) {
      this.logger.error(`Error during clean up of test data, error was: ${err}`)
    }
  }

  private parseNamespaceString(): number[] {
    return this.config.testdataNamespaceString
      .split(',')
      .map((part) => parseInt(part))
      .filter((part) => Number.isInteger(part))
  }

  private async identifyDeleteableObjects(
    namespaces: number[]
  ): Promise<DeleteableObjects> {
    let deleteableConfigs: DeleteableObjectRef[] = []
    let deleteableRuns: DeleteableObjectRef[] = []

    for (const currentNamespace of namespaces) {
      const { configs, runs } =
        await this.identifyDeleteableObjectsForNamespace(currentNamespace)
      deleteableConfigs = deleteableConfigs.concat(configs)
      deleteableRuns = deleteableRuns.concat(runs)
    }

    return { configs: deleteableConfigs, runs: deleteableRuns }
  }

  private async identifyDeleteableObjectsForNamespace(
    namespaceId: number
  ): Promise<DeleteableObjects> {
    const runs = await this.retrieveAllRuns(namespaceId)
    const deleteableRuns: DeleteableObjectRef[] = []
    const deleteableConfigs: DeleteableObjectRef[] = []
    const neededConfigs: ConfigSet = {}
    const allConfigs: ConfigSet = {}

    for (const run of runs) {
      allConfigs[run.config.globalId.toString()] = run.config
      if (this.isExpired(run)) {
        deleteableRuns.push({ namespaceId, id: run.id })
      } else {
        neededConfigs[run.config.globalId.toString()] = run.config
      }
    }

    for (const [configId, config] of Object.entries(allConfigs)) {
      if (!neededConfigs[configId]) {
        deleteableConfigs.push({
          namespaceId: namespaceId,
          id: config.id,
        })
      }
    }

    return { runs: deleteableRuns, configs: deleteableConfigs }
  }

  private async retrieveAllRuns(namespaceId: number): Promise<Run[]> {
    let resultList: Run[] = []
    let page = 1

    while (true) {
      const queryParams = new ListQueryHandler(page, 100, SortOrder.ASC, 'id')
      const runs = await this.runService.getList(namespaceId, queryParams)
      if (runs.entities.length === 0) {
        return resultList
      }
      resultList = resultList.concat(runs.entities)
      page++
    }
  }

  private isExpired(run: Run): boolean {
    if (!run.creationTime) {
      return true
    }
    return (
      this.today.getTime() - run.creationTime.getTime() > this.retentionPeriod
    )
  }

  private async deleteObjects(toDelete: DeleteableObjects): Promise<void> {
    for (const run of toDelete.runs) {
      this.logger.debug(`Delete run ${run.namespaceId}:${run.id}`)
      try {
        await this.runService.delete(
          run.namespaceId,
          run.id,
          SYSTEM_REQUEST_USER
        )
      } catch (err) {
        this.logger.error(
          `Cannot delete run ${run.namespaceId}:${run.id}, error was: ${err}`
        )
      }
    }

    for (const config of toDelete.configs) {
      this.logger.debug(`Delete config ${config.namespaceId}:${config.id}`)
      try {
        await this.configService.delete(config.namespaceId, config.id)
      } catch (err) {
        this.logger.error(
          `Cannot delete config ${config.namespaceId}:${config.id}, error was: ${err}`
        )
      }
    }
  }
}
