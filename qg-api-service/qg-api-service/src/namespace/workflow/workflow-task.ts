import { Inject, Injectable } from '@nestjs/common'
import { Interval } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Run, RunStatus } from '../run/run.entity'
import { WorkflowFinishedService } from './workflow-finished-service'
import { PinoLogger, Logger, InjectPinoLogger } from 'nestjs-pino'
import { QG_LOG_LEVEL } from '../../config'

const CHECKS_PER_MINUTE = 2
const TIMEOUT_FOR_WORKFLOWS_MS = 30 * 60 * 1000

@Injectable()
export class FinishedWorkflowDetectionTask {
  @InjectPinoLogger(FinishedWorkflowDetectionTask.name)
  private readonly logger = new Logger(
    new PinoLogger({
      pinoHttp: {
        level: QG_LOG_LEVEL,
        serializers: {
          req: () => undefined,
          res: () => undefined,
        },
      },
    }),
    {}
  )
  private isRunning = false

  constructor(
    @Inject(WorkflowFinishedService)
    private readonly workflowService: WorkflowFinishedService,
    @InjectRepository(Run) private readonly repository: Repository<Run>
  ) {}

  @Interval('finish_workflow', (60 / CHECKS_PER_MINUTE) * 1000)
  async checkFinishedWorkflows(): Promise<Promise<void>[]> {
    this.logger.debug({ msg: 'Execute recurring check of running workflows' })
    if (this.isRunning) {
      this.logger.debug({ msg: 'Previous workflow still running' })
      return
    }
    this.isRunning = true

    let stillRunningRuns: Run[]
    try {
      stillRunningRuns = await this.repository.find({
        where: [{ status: RunStatus.Running }, { status: RunStatus.Pending }],
        relations: ['config', 'namespace'],
      })
    } catch (err) {
      this.logger.warn({
        msg: `Could not retrieve runs that are not finished, error was: ${err}`,
      })
      stillRunningRuns = []
    }

    const promises = stillRunningRuns.map((run) => this.handleRun(run))
    this.logger.debug({ msg: 'Started all checks of running workflows' })
    this.isRunning = false

    return promises
  }

  private async handleRun(run: Run): Promise<void> {
    try {
      if (
        new Date().getTime() - run.creationTime?.getTime() >
        TIMEOUT_FOR_WORKFLOWS_MS
      ) {
        run.status = RunStatus.Failed
        run.log = ['Failed due to timeout']
        this.logger.warn({
          msg: `Run with id: ${run.globalId} (${run.namespace.id}:${run.id}) with argo name ${run.argoName} failed due to reaching timeout.`,
        })
        await this.repository.update({ globalId: run.globalId }, run)
        await this.repository.save(run)
      } else if (run.argoId && run.argoName && run.argoNamespace) {
        const workflowInfo =
          await this.workflowService.checkWorkflowHasFinished(
            run.argoId,
            run.argoName,
            run.argoNamespace
          )
        if (workflowInfo?.hasFinished) {
          await this.workflowService.updateWorkflowData(workflowInfo, run)
        }
      } else if (run.status === RunStatus.Running) {
        this.logger.warn({
          msg: `Run with id: ${run.globalId} (${run.namespace.id}:${run.id}) doesn't have Argo workflow information but is running.`,
        })
      }
      this.logger.debug({
        msg: `Finished checking run ${run.globalId} (${run.namespace.id}:${run.id})`,
      })
    } catch (err) {
      this.logger.warn({
        msg: `Check of run ${run.globalId} (${run.namespace.id}:${run.id}) failed due to ${err}`,
      })
    }
  }
}
