import { Inject, Injectable } from '@nestjs/common'
import { ApiProperty } from '@nestjs/swagger'
import { WorkflowImageConfig } from '../../namespace/workflow/workflow-argo.service'
import { ServiceConfig } from '../../service-config'
import { Version } from '../../namespace/workflow/workflow-creator'

export class VersionInformation {
  @ApiProperty({
    description: 'Version tag of the container image, the service runs in',
    example: 'top99crdev.azurecr.io/qg-aas-prod:1.0.0',
  })
  imageVersion: string

  @ApiProperty({
    description: 'Service version currently running',
    example: '1.0.0',
  })
  serviceVersion: string

  @ApiProperty({
    description:
      'Versions of workflow image that the service currently uses for runs',
    example: '{ "v0": "", "v1": "latest" }',
  })
  qgcliVersions: { [key: string]: string }
}

@Injectable()
export class VersionService {
  private readonly versionInformation: VersionInformation

  constructor(
    @Inject(ServiceConfig) serviceConfig: ServiceConfig,
    @Inject(WorkflowImageConfig) workflowImageConfig: WorkflowImageConfig
  ) {
    const qgcliVersions: { [_key in Version]: string } = {
      v0: '',
      ...workflowImageConfig.versions,
    }

    this.versionInformation = {
      imageVersion: serviceConfig.imageVersion,
      serviceVersion: serviceConfig.serviceVersion,
      qgcliVersions,
    }
  }

  getVersion(): VersionInformation {
    return this.versionInformation
  }
}
