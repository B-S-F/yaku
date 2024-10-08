import { streamToString } from '@B-S-F/api-commons-lib'
import { Inject, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { setTimeout } from 'timers/promises'
import { Repository } from 'typeorm'
import { parse } from 'yaml'
import { FindingService } from '../findings/finding.service'
import { Run as FindingsRun } from '../findings/utils/interfaces/qgRunMessageInterfaces'
import { Run, RunAuditService, RunResult, RunStatus } from '../run/run.entity'
import { SecretStorage } from '../secret/secret-storage.service'
import { ArgoService } from './argo.service'
import { BlobStore } from './minio.service'

import { InjectPinoLogger, PinoLogger } from 'nestjs-pino'
import { Action, AuditActor } from '../audit/audit.entity'
import { SYSTEM_REQUEST_USER } from '../module.utils'
export type WorkflowStatus = {
  status?: any // The status part of the workflow object returned by Argo
  hasFinished: boolean
}

const errorSeverity = 'error'
const infoSeverity = 'info'

type LogEntry = {
  severity: string
  message: string
}

type PodLogs = {
  init: LogEntry[]
  main: LogEntry[]
  wait: LogEntry[]
}

const knownErrors = {
  'exec /bin/argoexec: argument list too long':
    'Workflow failed, due to the environment variable section of the workflow exceeds the maximum size',
  'evidence.zip.tgz: no such file or directory': undefined,
}

const RESULTFILE = 'qg-result.yaml'
const EVIDENCEFILE = 'evidences.zip'

Injectable()
export class WorkflowFinishConfig {
  constructor(
    readonly resultDelay: number,
    private readonly skipCheckArgoArchive: boolean
  ) {}

  shouldSkipCheckArgoArchive(): boolean {
    return this.skipCheckArgoArchive
  }
}

@Injectable()
export class WorkflowFinishedService {
  @InjectPinoLogger(WorkflowFinishedService.name)
  private readonly logger = new PinoLogger({
    pinoHttp: {
      level: 'trace',
      serializers: {
        req: () => undefined,
        res: () => undefined,
      },
    },
  })
  private readonly processedRunList: number[] = []

  constructor(
    @Inject(ArgoService) private readonly argoService: ArgoService,
    @Inject(BlobStore) private readonly blobStore: BlobStore,
    @Inject(SecretStorage) private readonly secretStorage: SecretStorage,
    @Inject(FindingService) private readonly findingsService: FindingService,
    @Inject(WorkflowFinishConfig) private readonly config: WorkflowFinishConfig,
    @InjectRepository(Run) private readonly runRepository: Repository<Run>,
    @Inject(RunAuditService) private readonly runAuditService: RunAuditService
  ) {}

  async checkWorkflowHasFinished(
    workflowId: string,
    workflowName: string,
    workflowNamespace: string
  ): Promise<WorkflowStatus> {
    if (!workflowId || !workflowName || !workflowNamespace) {
      throw new Error('Workflow reference is not complete')
    }

    try {
      const requestStartTime = Date.now()
      const status = await this.argoService.getWorkflowStatus(
        workflowName,
        workflowNamespace
      )
      this.logger.debug(
        `Runtime for getWorkflowStatus: ${Date.now() - requestStartTime}ms`
      )
      if (status) {
        if (
          !status.phase ||
          status.phase === 'Running' ||
          status.phase === 'Pending'
        ) {
          return { hasFinished: false }
        } else {
          return {
            status,
            hasFinished: true,
          }
        }
      }
    } catch (err) {
      this.logger.error(`Get workflow status has failed with ${err}`)
    }

    if (this.config.shouldSkipCheckArgoArchive()) {
      this.logger.warn(
        `Argo workflow not present in k8s - potential bug, workflow: ${workflowNamespace}:${workflowName}, id: ${workflowId}`
      )
      return { hasFinished: false }
    }

    try {
      const requestStartTime = Date.now()
      const status = await this.argoService.getArchivedWorkflowStatus(
        workflowId
      )
      this.logger.debug(
        `Runtime for getArchivedWorkflowStatus: ${
          Date.now() - requestStartTime
        }ms`
      )
      if (status) {
        return {
          status,
          hasFinished: true,
        }
      }
    } catch (err) {
      this.logger.error(`Get archived workflow status has failed with ${err}`)
    }

    this.logger.debug(
      `No workflow information for workflow ${workflowNamespace}:${workflowName}`
    )
    return { hasFinished: false }
  }

  async updateWorkflowData(
    workflowStatus: WorkflowStatus,
    run: Run
  ): Promise<Run> {
    if (this.processedRunList.includes(run.globalId)) {
      this.logger.debug(`Run ${run.namespace.id}:${run.id} is processed`)
      return run
    }
    this.processedRunList.push(run.globalId)
    const original = run.DeepCopy()
    this.logger.trace({
      msg: `Workflow for run ${run.namespace.id}:${run.id} finished, retrieve workflow result data`,
    })

    if (workflowStatus.status?.finishedAt) {
      run.completionTime = new Date(workflowStatus.status.finishedAt)
    } else {
      run.completionTime = new Date()
      this.logger.warn({
        msg: `Argo workflow status didn't contain a finishedAt time. Using the current time instead for run ${run.namespace.id}:${run.id}`,
      })
    }
    this.logger.trace({
      msg: `Workflow for run ${run.namespace.id}:${run.id} finished at ${workflowStatus.status?.finishedAt} with status ${workflowStatus.status?.phase}`,
    })

    let result = await this.provideResult(run.storagePath)
    if (!result) {
      this.logger.debug({
        msg: `Results for run ${run.namespace.id}:${run.id} not found in first try, wait and retrieve again`,
      })
      await setTimeout(this.config.resultDelay)
      result = await this.provideResult(run.storagePath)
      if (!result) {
        this.logger.debug(
          `Results for run ${run.namespace.id}:${run.id} not found in second try, wait and retrieve again`
        )
        await setTimeout(3 * this.config.resultDelay)
        result = await this.provideResult(run.storagePath)
        if (!result) {
          this.logger.debug(
            `Results for run ${run.namespace.id}:${run.id} not found in third and last try as well`
          )
        }
      }
    }
    const log = await this.retrieveLogs(run.argoName, run.argoNamespace)

    this.logger.trace({
      msg: `Workflow for run ${run.namespace.id}:${run.id} finished, calculate final run data`,
    })

    if (result) {
      run.overallResult = this.retrieveOverallResult(result)
    }
    if (run.overallResult) {
      run.status = RunStatus.Completed
      if (log.main.length > 0) {
        run.log = this.hideSecrets(
          log.main.map((line) => line.message),
          await this.secretStorage.getSecrets(run.namespace.id)
        )
      } else {
        run.log = ['Logs not available, but result exists']
      }
      if (run.status === RunStatus.Completed) {
        try {
          const messageFormat = await this.messageFormatBuilder(run)
          const runData: FindingsRun = JSON.parse(messageFormat.run)
          await this.findingsService.processFindings(
            runData,
            messageFormat.result
          )
        } catch (error) {
          this.logger.error(
            `Findings of the run: ${run.id} will not be propagated due to ${error.message}`
          )
        }
      }
    } else {
      run.status = RunStatus.Failed
      run.log = [
        'Workflow has not finished properly, no result found or result corrupted',
      ]
      if (log.main.length > 0) {
        run.log.push('==========')
        run.log = run.log.concat(log.main.map((line) => line.message))
      }
    }

    run.log = this.appendLogFindings(log, run.log)

    this.logger.trace({
      msg: `Workflow for run ${run.namespace.id}:${run.id} finished, update database and send events`,
    })

    const queryRunner =
      this.runRepository.manager.connection.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction('READ UNCOMMITTED')
      await queryRunner.manager.update(Run, { globalId: run.globalId }, run)
      const savedRun = await queryRunner.manager.save(run)
      await this.runAuditService.append(
        run.namespace.id,
        run.id,
        original,
        run,
        AuditActor.convertFrom(SYSTEM_REQUEST_USER),
        Action.UPDATE,
        queryRunner.manager
      )
      await queryRunner.commitTransaction()
      await queryRunner.release()

      return savedRun
    } catch (err) {
      this.logger.error({
        msg: `Updating workflow data for run ${run.namespace.id}:${run.id} failed due to error ${err}`,
      })
      await queryRunner.rollbackTransaction()
      await queryRunner.release()
      throw err
    } finally {
      this.logger.trace({
        msg: `Processing of finished run ${run.namespace.id}:${run.id} executed`,
      })
    }
  }

  private async messageFormatBuilder(run: Run) {
    const result = await this.blobStore
      .downloadResult(run.storagePath, RESULTFILE)
      .then((result) => streamToString(result))
      .catch(() => null)
    const runData = JSON.stringify(
      {
        globalId: run.globalId,
        namespaceId: run.namespace.id,
        id: run.id,
        configId: run.config.id,
        creationTime: run.creationTime,
        completionTime: run.completionTime,
        status: run.status,
        overallResult: run.overallResult,
      },
      null,
      2
    )
    return { run: runData, result: result }
  }

  private async retrieveLogs(
    workflowName: string,
    workflowNamespace: string
  ): Promise<PodLogs> {
    const argoLogs = await this.getArgoLogs(workflowName, workflowNamespace)
    if (argoLogs.main.length > 0) {
      return argoLogs
    }
    this.logger.debug('No logs found in Argo, trying S3 store')
    const logFile = await this.blobStore.downloadLogs(workflowName)
    if (logFile) {
      return {
        main: logFile.split('\n').map((line) => {
          return { severity: 'info', message: line }
        }),
        init: argoLogs.init,
        wait: argoLogs.wait,
      }
    }
    return { main: [], init: argoLogs.init, wait: argoLogs.wait }
  }

  private appendLogFindings(podLogs: PodLogs, logArray: string[]): string[] {
    const filterFunction = (entry: LogEntry) => entry.severity === errorSeverity
    const errors = podLogs.init
      .filter(filterFunction)
      .concat(podLogs.wait.filter(filterFunction))

    if (errors.length === 0) {
      return logArray
    }

    const errorMessages: string[] = []

    errorMessages.push('==========')
    errorMessages.push(
      'Errors identified during initialization or shutdown of workflow pod:'
    )

    const identifyKnownError = (message: string) => {
      const knownKey = Object.keys(knownErrors).filter((known) =>
        message.includes(known)
      )
      return knownErrors[knownKey[0]] ?? undefined
    }

    for (const errorEntry of errors) {
      const knownError = identifyKnownError(errorEntry.message)
      if (knownError) {
        errorMessages.push(knownError)
      }
      this.logger.warn(`Argo log error: ${errorEntry.message}`)
    }

    return errorMessages.length > 2 ? logArray.concat(errorMessages) : logArray
  }

  private retrieveOverallResult(resultData: string): RunResult {
    try {
      const result = parse(resultData)
      return result.overallStatus as RunResult
    } catch (err) {
      this.logger.error(`Error happened during extraction of result: ${err}`)
      return undefined
    }
  }

  private async getArgoLogs(
    workflowName: string,
    workflowNamespace: string
  ): Promise<PodLogs> {
    const main = await this.getArgoLogData(
      workflowName,
      workflowNamespace,
      'main'
    )
    const init = await this.getArgoLogData(
      workflowName,
      workflowNamespace,
      'init'
    )
    const wait = await this.getArgoLogData(
      workflowName,
      workflowNamespace,
      'wait'
    )
    return { init, main, wait }
  }

  private async getArgoLogData(
    workflowName: string,
    workflowNamespace: string,
    container: any
  ): Promise<LogEntry[]> {
    const requestStartTime = Date.now()
    const logData = await this.argoService.getWorkflowLogs(
      workflowName,
      workflowNamespace,
      container
    )
    this.logger.debug(
      `Runtime for getWorkflowLogs: ${Date.now() - requestStartTime}ms`
    )

    if (!logData || logData.length === 0) {
      return []
    }

    const logLines = logData
      .split('\n')
      .filter(
        (line) =>
          line.startsWith('{"result":{"content":') && line.includes('podName')
      )
      .map((line) => {
        const indexOfEnd = line.indexOf('podName') - 3
        const content = line.substring(22, indexOfEnd)
        return content
      })
      .map((line) => {
        const severity =
          line.includes('level=fatal') || line.includes('level=error')
            ? errorSeverity
            : infoSeverity
        return { severity, message: line }
      })

    return logLines
  }

  private async provideResult(
    storagePath: string
  ): Promise<string | undefined> {
    const evidenceExists = await this.blobStore.fileExists(
      storagePath,
      EVIDENCEFILE
    )
    if (evidenceExists) {
      try {
        const result = streamToString(
          await this.blobStore.downloadResult(storagePath, RESULTFILE)
        )
        return result
      } catch (err) {
        // no result file found, standard return applies
      }
    }

    return undefined
  }

  private replaceAll(input: string, substring: string, replacement: string) {
    let output = ''
    let position = 0
    let foundAt = input.indexOf(substring, position)
    while (foundAt != -1) {
      output += input.substring(position, foundAt)
      output += replacement
      position = foundAt + substring.length
      foundAt = input.indexOf(substring, position)
    }
    output += input.substring(position)
    return output
  }

  private hideSecrets(log: string[], secrets: { [key: string]: string }) {
    if (!secrets) {
      return log
    }
    const processedLog = []
    for (let line of log) {
      for (const [secretName, secretValue] of Object.entries(secrets)) {
        line = this.replaceAll(line, secretValue, `***${secretName}***`)
      }
      processedLog.push(line)
    }
    return processedLog
  }
}
