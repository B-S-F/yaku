import { Inject, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { AssertionError } from 'assert'
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino'
import { Readable } from 'stream'
import { Repository } from 'typeorm'
import { Action, AuditActor } from '../audit/audit.entity'
import { ConfigsService } from '../configs/configs.service'
import { Run, RunAuditService, RunStatus } from '../run/run.entity'
import { SecretStorage } from '../secret/secret-storage.service'
import { ArgoService } from './argo.service'
import { BlobStore } from './minio.service'
import {
  CheckIdentifier,
  EnvList,
  SupportedVersion,
  newWorkflow,
} from './workflow-creator'
import { WorkflowFinishedService } from './workflow-finished-service'
import { SYSTEM_REQUEST_USER } from '../module.utils'

@Injectable()
export class PrivateCloudConfig {
  constructor(
    readonly inPrivateCloud: boolean,
    readonly proxy: string,
    readonly noProxyOn: string,
    readonly pullSecretName: string
  ) {}
}

@Injectable()
export class WorkflowImageConfig {
  constructor(
    readonly image: string,
    readonly versions: { [_key in SupportedVersion]: string },
    readonly pullPolicy: string
  ) {}
}

export type WorkflowOptions = {
  environment: EnvList
  singleCheck?: CheckIdentifier
}

@Injectable()
export class WorkflowManager {
  @InjectPinoLogger(WorkflowManager.name)
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
    @Inject(BlobStore) private readonly blobStore: BlobStore,
    @Inject(ArgoService) private readonly argoService: ArgoService,
    @Inject(WorkflowFinishedService)
    private readonly workflowFinishedService: WorkflowFinishedService,
    @Inject(ConfigsService) private readonly configService: ConfigsService,
    @Inject(SecretStorage) private readonly secretStore: SecretStorage,
    @Inject(WorkflowImageConfig)
    private readonly workflowImageConfig: WorkflowImageConfig,
    @Inject(PrivateCloudConfig)
    private readonly privateCloudConfig: PrivateCloudConfig,
    @InjectRepository(Run) private readonly runRepository: Repository<Run>,
    @Inject(RunAuditService)
    private readonly auditService: RunAuditService
  ) {}

  async run(run: Run, options: WorkflowOptions): Promise<void> {
    try {
      this.logger.trace({
        msg: `Start asynchronous creation of Argo workflow for config ${run.config.id}`,
      })

      const downloadConfigDataTime = Date.now()
      const secrets = await this.secretStore.getSecrets(run.namespace.id)
      const configFiles = await this.configService.getContentOfMultipleFiles(
        run.namespace.id,
        run.config.id,
        run.config.files.map((file) => file.filename)
      )
      const { inPrivateCloud, proxy, noProxyOn, pullSecretName } =
        this.privateCloudConfig
      const { image, versions, pullPolicy } = this.workflowImageConfig
      this.logger.debug({
        msg: `POST /runs: Retrieval of config files from database took: ${
          Date.now() - downloadConfigDataTime
        }ms`,
      })

      const { configs, workflow } = newWorkflow()
        .setConfigFiles(configFiles, options.singleCheck)
        .setCloudType(inPrivateCloud, proxy, noProxyOn, pullSecretName)
        .setOverwrittenVariables(options.environment)
        .setSecrets(secrets)
        .addExecutionInformation(image, versions, pullPolicy)
        .addOutputs(run.storagePath)
        .addEnvironmentSection()
        .addInputs(run.storagePath)
        .create()

      const uploadStartTime = Date.now()
      await this.blobStore.uploadConfig(run.storagePath, configs)
      this.logger.debug({
        msg: `POST /runs: Upload configs took: ${
          Date.now() - uploadStartTime
        }ms`,
      })

      const argoStartTime = Date.now()
      const argoResult = await this.argoService.startWorkflow(workflow)

      this.logger.debug({
        msg: `POST /runs: Start argo workflow took: ${
          Date.now() - argoStartTime
        }ms`,
      })

      const original = run.DeepCopy()
      run.argoName = argoResult.name
      run.argoNamespace = argoResult.namespace
      run.argoId = argoResult.uid
      run.creationTime = new Date(argoResult.creationTimestamp)
      run.status = RunStatus.Running
      await this.updateRun(original, run)
    } catch (err) {
      const original = run.DeepCopy()
      run.status = RunStatus.Failed
      run.log = ['Error while starting the workflow']
      if (err instanceof AssertionError) {
        run.log.push(err.message)
        this.logger.debug({
          msg: `Starting workflow ${run.globalId} (${run.namespace.id}:${run.id}) failed due to an configuration error ${err}`,
        })
      } else {
        this.logger.error({
          msg: `Starting workflow ${run.globalId} (${run.namespace.id}:${run.id}) failed due to error ${err}`,
        })
      }
      await this.updateRun(original, run)
    }
    this.logger.trace({ msg: 'End asynchronous creation of Argo workflow' })
  }

  async updateRun(original: Run, updated: Run): Promise<void> {
    const queryRunner =
      this.runRepository.manager.connection.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction('READ UNCOMMITTED')
      await queryRunner.manager.update(
        Run,
        { globalId: updated.globalId },
        updated
      )
      await queryRunner.manager.save(Run, updated)
      await this.auditService.append(
        updated.namespace.id,
        updated.id,
        original,
        updated,
        AuditActor.convertFrom(SYSTEM_REQUEST_USER),
        Action.UPDATE,
        queryRunner.manager
      )
      await queryRunner.commitTransaction()
    } catch (err) {
      this.logger.error({
        msg: `Storing run ${updated.globalId} (${updated.namespace.id}:${updated.id}) has failed during workflow startup failed due to error ${err}`,
      })
      await queryRunner.rollbackTransaction()
      throw err
    } finally {
      await queryRunner.release()
    }
  }

  async updateRunIfFinished(run: Run): Promise<Run> {
    try {
      const workflowInfo =
        await this.workflowFinishedService.checkWorkflowHasFinished(
          run.argoId,
          run.argoName,
          run.argoNamespace
        )
      if (workflowInfo.hasFinished) {
        const newRun = await this.workflowFinishedService.updateWorkflowData(
          workflowInfo,
          run
        )
        return newRun
      }
    } catch (err) {
      this.logger.error({
        msg: `Severe error happened while checking whether workflow has finished: ${err}`,
      })
    }
    return run
  }

  async downloadResult(
    storagePath: string,
    filename: string
  ): Promise<Readable> {
    return this.blobStore.downloadResult(storagePath, filename)
  }

  async deleteWorkflowArtifacts(run: Run): Promise<void> {
    if (run.storagePath) {
      await this.blobStore.removePath(run.storagePath)
    }
    if (run.argoName) {
      await this.blobStore.removePath(run.argoName)
    }
  }
}
