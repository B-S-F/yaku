import { Inject, Injectable } from '@nestjs/common'
@Injectable()
export class ArgoConfig {
  constructor(readonly namespace: string, readonly server: string) {}
}

@Injectable()
export class ArgoService {
  constructor(@Inject(ArgoConfig) private readonly argoConfig: ArgoConfig) {}

  async startWorkflow(data: string): Promise<any> {
    const namespace = this.argoConfig.namespace
    const url = `${this.argoConfig.server}/api/v1/workflows/${namespace}`
    const config = {
      method: 'POST',
      body: data,
      headers: { 'Content-Type': 'application/json' },
    }
    const result = await fetch(url, config)
    await this.checkForError(result, url)
    const { metadata } = await result.json()
    return { ...metadata, namespace }
  }

  async getWorkflowStatus(
    workflowName: string,
    workflowNamespace: string
  ): Promise<any> {
    const url = `${this.argoConfig.server}/api/v1/workflows/${workflowNamespace}/${workflowName}`
    return this.getStatus(url)
  }

  async getArchivedWorkflowStatus(workflowId: string): Promise<any> {
    const url = `${this.argoConfig.server}/api/v1/archived-workflows/${workflowId}`
    return this.getStatus(url)
  }

  private async getStatus(url: string): Promise<any> {
    const config = {
      method: 'GET',
    }

    const result = await fetch(url, config)

    if (result?.status === 404) {
      return null
    }
    await this.checkForError(result, url)
    return (await result.json()).status
  }

  async getWorkflowLogs(
    workflowName: string,
    workflowNamespace: string,
    container: 'main' | 'init' | 'wait' = 'main'
  ): Promise<string> {
    if (!['main', 'init', 'wait'].includes(container)) {
      throw new Error('Unknown container name')
    }
    const url = `${this.argoConfig.server}/api/v1/workflows/${workflowNamespace}/${workflowName}/log?logOptions.container=${container}&logOptions.follow=true`
    const config = {
      method: 'GET',
    }
    const result = await fetch(url, config)
    if (result?.status === 404) {
      return null
    }
    await this.checkForError(result, url)
    return result.text()
  }

  private async checkForError(result: Response, url: string): Promise<void> {
    if (!result) {
      throw new Error(`Calling ${url} did not return a result`)
    }
    if (result.status >= 300) {
      const errorText = await result.text()
      const errorMessage = errorText ? ` with message ${errorText}` : ''
      throw new Error(
        `Calling ${url} resulted in ${result.status}${errorMessage}`
      )
    }
  }
}
