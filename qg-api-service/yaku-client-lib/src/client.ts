import assert from 'assert'
import { access, readFile, writeFile } from 'fs/promises'
import * as path from 'path'
import ClientConfig from './client-config.js'
import {
  FileData,
  callViaPost,
  createResource,
  deleteResource,
  getResource,
  getResourceBinaryData,
  listAllResources,
  transformData,
  updateResource,
  uploadData,
} from './api-calls.js'
import {
  Config,
  ConfigPaginated,
  FileMetadata,
  FindingsPaginated,
  Namespace,
  NewToken,
  NewTokenMetadata,
  Run,
  RunPaginated,
  SecretMetadata,
  SecretPaginated,
  VersionInformation,
  YakuClientConfig,
} from './types.js'
import { getFilenameFromUrl } from './utils.js'

export class QueryOptions {
  constructor(
    readonly page: number,
    readonly itemCount: number,
    readonly filterProperty: string[] | undefined,
    readonly filterValues: string[][] | undefined,
    readonly sortBy: string | undefined,
    readonly ascending: boolean = false
  ) {}
}

export class ApiClient {
  constructor(private readonly config: YakuClientConfig) {
    ClientConfig.setConfig(config)
  }

  async getNamespaces(): Promise<Namespace[]> {
    const url = `${this.config.baseUrl}/namespaces`
    return getResource<Namespace[]>(url, this.config.token)
  }

  async createConfig(
    namespaceId: number,
    name: string,
    description: string
  ): Promise<Config> {
    const url = `${this.getServiceUrl(namespaceId)}/configs`
    if (!name?.trim()) {
      throw new Error('Config name must be defined')
    }
    const body = description?.trim() ? { name, description } : { name }
    return createResource<Config>(url, body, this.config.token)
  }

  async createConfigWithFiles(
    namespaceId: number,
    name: string,
    description: string,
    files: FileMetadata[]
  ): Promise<Config> {
    const config = await this.createConfig(namespaceId, name, description)
    await Promise.all(
      files.map(async (file) =>
        this.uploadFileToConfig(
          namespaceId,
          config.id,
          file.filepath,
          file.filename
        )
      )
    )
    return this.getConfig(namespaceId, config.id)
  }

  async listConfigs(
    namespaceId: number,
    queryOptions: QueryOptions
  ): Promise<ConfigPaginated> {
    const url = this.addQueryOptionsToUrl(
      `${this.getServiceUrl(namespaceId)}/configs`,
      queryOptions
    )
    return getResource<ConfigPaginated>(url, this.config.token)
  }

  async listAllConfigs(
    namespaceId: number,
    queryOptions: QueryOptions
  ): Promise<Config[]> {
    let page = 1
    let result: Config[] = []
    for (;;) {
      const data: ConfigPaginated = await this.listConfigs(
        namespaceId,
        this.copyQueryOptionsForPage(page, queryOptions)
      )
      result = result.concat(data.data)
      if (data.links.next) {
        page++
      } else {
        return result
      }
    }
  }

  async getConfig(namespaceId: number, configId: number): Promise<Config> {
    const url = `${this.getServiceUrl(namespaceId)}/configs/${configId}`
    return getResource<Config>(url, this.config.token)
  }

  async updateConfig(
    namespaceId: number,
    configId: number,
    name: string | undefined,
    description: string | null | undefined
  ): Promise<Config> {
    const url = `${this.getServiceUrl(namespaceId)}/configs/${configId}`
    const changedName = name?.trim()
    if (!changedName && description === undefined) {
      throw new Error('At least name or description needs to be changed')
    }
    let body: any
    if (description !== undefined && changedName) {
      body = { name: changedName, description }
    } else if (changedName) {
      body = { name: changedName }
    } else {
      body = { description }
    }
    return updateResource<Config>(url, body, this.config.token)
  }

  async deleteConfig(
    namespaceId: number,
    configId: number,
    forced = false
  ): Promise<void> {
    if (forced) {
      const data: Run[] = await this.listAllRuns(
        namespaceId,
        new QueryOptions(1, 100, ['config'], [[`${configId}`]], '', false)
      )
      const deletionPossible =
        data.filter(
          (run) => run.status === 'running' || run.status === 'pending'
        ).length === 0
      if (data.length > 0) {
        if (deletionPossible) {
          for (const run of data) {
            await this.deleteRun(namespaceId, run.id)
          }
        } else {
          throw new Error(
            'Forced deletion of a config is only possible if all associated runs have been completed'
          )
        }
      }
    }
    const url = `${this.getServiceUrl(namespaceId)}/configs/${configId}`
    return deleteResource(url, this.config.token)
  }

  async createConfigFromExcel(
    namespaceId: number,
    configId: number,
    xlsxFilepath: string,
    configFilepath: string
  ): Promise<string> {
    const url = `${this.getServiceUrl(
      namespaceId
    )}/configs/${configId}/config-from-excel`
    const form = new FormData()
    const xlsxFile = await readFile(xlsxFilepath)
    const configFile = await readFile(configFilepath)
    form.append('xlsx', new Blob([xlsxFile]))
    form.append('config', new Blob([configFile]))
    return transformData(url, form, this.config.token).then((content) =>
      this.writeFile(content)
    )
  }

  async createConfigFromQuestionnaire(
    namespaceId: number,
    configId: number,
    questionnaireFilepath: string
  ): Promise<string> {
    const url = `${this.getServiceUrl(
      namespaceId
    )}/configs/${configId}/initial-config`
    const form = new FormData()
    const configFile = await readFile(questionnaireFilepath)
    form.append('content', new Blob([configFile]))
    return transformData(url, form, this.config.token).then((content) =>
      this.writeFile(content)
    )
  }

  async uploadFileToConfig(
    namespaceId: number,
    configId: number,
    filepath: string,
    alternativeFilename?: string
  ): Promise<void> {
    const url = `${this.getServiceUrl(namespaceId)}/configs/${configId}/files`
    const data = await readFile(filepath)
    const filename = alternativeFilename ?? path.parse(filepath).base
    const form = new FormData()
    form.append('filename', filename)
    form.append('content', new Blob([data.toString()]))
    return uploadData(url, form, this.config.token, false)
  }

  async replaceFileInConfig(
    namespaceId: number,
    configId: number,
    filepath: string,
    filename?: string
  ): Promise<void> {
    filename = filename ?? path.parse(filepath).base
    const url = `${this.getServiceUrl(
      namespaceId
    )}/configs/${configId}/files/${filename}`
    const data = await readFile(filepath)
    const form = new FormData()
    form.append('content', new Blob([data.toString()]))
    return uploadData(url, form, this.config.token, true)
  }

  async getFileData(
    namespaceId: number,
    configId: number,
    filename: string
  ): Promise<FileData> {
    const url = `${this.getServiceUrl(
      namespaceId
    )}/configs/${configId}/files/${filename}`

    return getResourceBinaryData(url, this.config.token)
  }

  async downloadFileData(
    namespaceId: number,
    configId: number,
    filename: string
  ): Promise<string> {
    const url = `${this.getServiceUrl(
      namespaceId
    )}/configs/${configId}/files/${filename}`
    return getResourceBinaryData(url, this.config.token).then((content) =>
      this.writeFile(content)
    )
  }

  async deleteFileFromConfig(
    namespaceId: number,
    configId: number,
    filename: string
  ): Promise<void> {
    const url = `${this.getServiceUrl(
      namespaceId
    )}/configs/${configId}/files/${filename}`
    return deleteResource(url, this.config.token)
  }

  async deleteAllFilesFromConfig(
    namespace: number,
    configId: number,
    removeQgConfig: boolean
  ) {
    const config = await this.getConfig(namespace!, configId)
    if (config.files.additionalConfigs) {
      await Promise.all(
        config.files.additionalConfigs.map(async (fileUrl: string) => {
          const filename = getFilenameFromUrl(fileUrl)
          await this.deleteFileFromConfig(namespace!, configId, filename)
        })
      )
    }

    if (removeQgConfig && config.files.qgConfig) {
      await this.deleteFileFromConfig(
        namespace!,
        configId,
        getFilenameFromUrl(config.files.qgConfig)
      )
    }
  }

  async listRuns(
    namespaceId: number,
    queryOptions: QueryOptions
  ): Promise<RunPaginated> {
    const url = this.addQueryOptionsToUrl(
      `${this.getServiceUrl(namespaceId)}/runs`,
      queryOptions
    )
    return getResource<RunPaginated>(url, this.config.token)
  }

  async listAllRuns(
    namespaceId: number,
    queryOptions: QueryOptions
  ): Promise<Run[]> {
    let pageNumber = 1
    let page: RunPaginated | undefined = undefined
    const result: Run[] = []

    // outer do-while: collect all pages
    do {
      // inner do-while: collect current page - try multiple times.
      do {
        page = await this.listRuns(
          namespaceId,
          this.copyQueryOptionsForPage(pageNumber, queryOptions)
        )
      } while (!page)

      // now that the page is guaranteed to be available, add the data and check if another page is to be fetched
      result.push(...page.data)
      pageNumber++
    } while (page.links.next)
    return result
  }

  async startRun(
    namespaceId: number,
    configId: number,
    environment?: { [key: string]: string }
  ): Promise<Run> {
    const url = `${this.getServiceUrl(namespaceId)}/runs`

    const sendAdditionalEnvVariables =
      environment !== undefined && Object.keys(environment).length > 0
    const body = sendAdditionalEnvVariables
      ? { configId, environment }
      : { configId }

    return createResource<Run>(url, body, this.config.token)
  }

  async getRun(
    namespaceId: number,
    runId: number,
    details = true
  ): Promise<Run> {
    const url = `${this.getServiceUrl(namespaceId)}/runs/${runId}`
    const result = await getResource<Run>(url, this.config.token)
    if (!details) {
      delete result.argoName
      delete result.argoNamespace
      delete result.log
    }
    return result
  }

  /**
   * Starts the run and regularly polls the status, until the run is no longer pending/completed.
   * Returns the run.
   * @throws an error if the POST /run endpoint was inaccessible
   * @return the Run if the POST /run endpoint let the request pass
   */
  async startAndAwaitRun(
    namespaceId: number,
    configId: number,
    environment?: { [key: string]: string },
    pollInterval = 5000
  ): Promise<Run> {
    const startedRun = await this.startRun(namespaceId, configId, environment)

    let result: Run | undefined = undefined
    for (;;) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval))
      result = await this.getRun(namespaceId, startedRun.id)
      if (result.status !== 'running' && result.status !== 'pending') {
        return result
      }
    }
  }

  async getRunResult(namespaceId: number, runId: number): Promise<string> {
    const url = `${this.getServiceUrl(namespaceId)}/runs/${runId}/results`
    return getResourceBinaryData(url, this.config.token).then((content) =>
      this.writeFile(content)
    )
  }

  async getRunEvidences(namespaceId: number, runId: number): Promise<string> {
    const url = `${this.getServiceUrl(namespaceId)}/runs/${runId}/evidences`
    return getResourceBinaryData(url, this.config.token).then((content) =>
      this.writeFile(content)
    )
  }

  async deleteRun(namespaceId: number, runId: number): Promise<void> {
    const url = `${this.getServiceUrl(namespaceId)}/runs/${runId}`
    return deleteResource(url, this.config.token)
  }

  async listSecrets(
    namespaceId: number,
    queryOptions: QueryOptions
  ): Promise<SecretPaginated> {
    const url = this.addQueryOptionsToUrl(
      `${this.getServiceUrl(namespaceId)}/secrets`,
      queryOptions
    )
    return getResource<SecretPaginated>(url, this.config.token)
  }

  async listAllSecrets(
    namespaceId: number,
    queryOptions: QueryOptions
  ): Promise<SecretMetadata[]> {
    let page = 1
    let result: SecretMetadata[] = []
    for (;;) {
      const data: SecretPaginated = await this.listSecrets(
        namespaceId,
        this.copyQueryOptionsForPage(page, queryOptions)
      )
      result = result.concat(data.data)
      if (data.links.next) {
        page++
      } else {
        return result
      }
    }
  }

  async createSecret(
    namespaceId: number,
    name: string,
    secret: string,
    description: string | undefined
  ): Promise<SecretMetadata> {
    const url = `${this.getServiceUrl(namespaceId)}/secrets`
    if (!name?.trim()) {
      throw new Error('Secret name undefined')
    }
    if (!secret?.trim()) {
      throw new Error('Secret value undefined')
    }
    const body = description ? { name, description, secret } : { name, secret }
    return createResource<SecretMetadata>(url, body, this.config.token)
  }

  async updateSecret(
    namespaceId: number,
    name: string,
    secret: string | undefined,
    description: string | null | undefined
  ): Promise<SecretMetadata> {
    const changedName = name?.trim()
    const changedSecret = secret?.trim()
    const trimmedDescription = description?.trim()
    const changedDescription =
      description === null || trimmedDescription === ''
        ? null
        : trimmedDescription
    if (!changedName) {
      throw new Error('Cannot identify secret to be updated')
    }
    if (changedDescription === undefined && !changedSecret) {
      throw new Error(
        'At least secret value or description needs to be changed'
      )
    }
    const url = `${this.getServiceUrl(namespaceId)}/secrets/${changedName}`
    let body: any
    if (changedDescription !== undefined && changedSecret) {
      body = { description: changedDescription, secret }
    } else if (changedSecret) {
      body = { secret }
    } else {
      body = { description: changedDescription }
    }
    return updateResource<SecretMetadata>(url, body, this.config.token)
  }

  async deleteSecret(namespaceId: number, name: string): Promise<void> {
    const url = `${this.getServiceUrl(namespaceId)}/secrets/${name}`
    return deleteResource(url, this.config.token)
  }

  async getServiceInfo(): Promise<VersionInformation> {
    const url = `${this.config.baseUrl}/service/info`
    return getResource<VersionInformation>(url, this.config.token)
  }

  async listNewTokens(): Promise<NewTokenMetadata[]> {
    const url = `${this.config.baseUrl}/long-running-tokens`
    return listAllResources<NewTokenMetadata>(url, this.config.token)
  }

  async createNewToken(description: string): Promise<NewToken> {
    const url = `${this.config.baseUrl}/long-running-tokens`
    const body = { description, try_admin: false }
    return createResource<NewToken>(url, body, this.config.token)
  }

  async revokeNewToken(id: number): Promise<void> {
    const url = `${this.config.baseUrl}/long-running-tokens/${id}/revoke`
    return callViaPost(url, this.config.token)
  }

  async createNamespace(name: string): Promise<Namespace> {
    const url = `${this.config.baseUrl}/namespaces`
    if (!name?.trim()) {
      throw new Error('Namespace name not defined')
    }
    const body = {
      name,
      users: [],
    }
    return createResource<Namespace>(url, body, this.config.token)
  }

  async createNamespaceWithConfig(
    name: string,
    configFile: string
  ): Promise<Namespace> {
    const namespace = await this.createNamespace(name)
    await this.createConfigWithFiles(
      namespace.id,
      'default',
      'This is a default config containing a qg-config.yaml',
      [
        {
          filename: 'qg-config.yaml',
          filepath: configFile,
        },
      ]
    )
    return namespace
  }

  async getNamespace(id: number): Promise<Namespace> {
    const url = `${this.getServiceUrl(id)}`
    return getResource<Namespace>(url, this.config.token)
  }

  async updateNamespace(id: number, name: string): Promise<Namespace> {
    const url = `${this.getServiceUrl(id)}`

    const body = name ? { name, users: [] } : { usrs: [] }
    return updateResource<Namespace>(url, body, this.config.token)
  }

  async listFindings(
    namespace: number,
    queryOptions: QueryOptions
  ): Promise<FindingsPaginated> {
    const url = this.addQueryOptionsToUrl(
      `${this.getServiceUrl(namespace)}/findings`,
      queryOptions
    )
    return getResource<FindingsPaginated>(url, this.config.token)
  }

  async resolveFinding(
    namespace: number,
    id: string,
    options: { comment?: string }
  ): Promise<void> {
    const url = `${this.getServiceUrl(namespace)}/findings/${id}`

    let resolver = undefined
    // Get resolver as current user having the given azure or jwt token
    try {
      const token = this.config.token
      const payload = token.split('.')[1]
      const payloadString = Buffer.from(payload, 'base64').toString('utf8')
      const payloadObject = JSON.parse(payloadString)

      // Get name depending on token type (Azure or JWT)
      resolver =
        payloadObject.name ||
        payloadObject.username ||
        payloadObject.preferred_username
      assert(resolver)
    } catch (err) {
      throw new Error(`Failed to parse user token`)
    }

    const body = {
      status: 'resolved',
      resolver: resolver,
      resolvedDate: new Date().toISOString(),
      resolvedComment: options.comment ?? null,
    }
    return updateResource(url, body, this.config.token)
  }

  async reopenFinding(namespace: number, id: string): Promise<void> {
    const url = `${this.getServiceUrl(namespace)}/findings/${id}`
    const body = {
      status: 'unresolved',
      resolver: null,
      resolvedDate: null,
      resolvedComment: null,
    }
    return updateResource(url, body, this.config.token)
  }

  private getServiceUrl(namespaceId: number) {
    return `${this.config.baseUrl}/namespaces/${namespaceId}`
  }

  private async writeFile(content: FileData): Promise<string> {
    let usableFilename = content.filename
    let currentCount = 1
    while (await this.fileExists(usableFilename)) {
      const separatorIndex = content.filename.lastIndexOf('.')
      usableFilename = `${content.filename.substring(
        0,
        separatorIndex
      )}${currentCount}${content.filename.substring(separatorIndex)}`
      currentCount++
    }
    await writeFile(usableFilename, content.data)
    return usableFilename
  }

  private async fileExists(filepath: string): Promise<boolean> {
    try {
      await access(filepath)
      return true
    } catch (e) {
      return false
    }
  }

  private addQueryOptionsToUrl(
    baseurl: string,
    queryOptions: QueryOptions
  ): string {
    const url = new URL(baseurl)
    url.searchParams.append('page', queryOptions.page!.toString(10))
    url.searchParams.append('items', queryOptions.itemCount!.toString(10))
    url.searchParams.append(
      'sortOrder',
      queryOptions.ascending ? 'ASC' : 'DESC'
    )
    if (queryOptions.filterProperty) {
      for (let i = 0; i < queryOptions.filterProperty.length; i++) {
        const valueString = queryOptions.filterValues![i].join(',')
        if (valueString) {
          url.searchParams.append(
            'filter',
            `${queryOptions.filterProperty[i]}=${valueString}`
          )
        }
      }
    }
    if (queryOptions.sortBy) {
      url.searchParams.append('sortBy', queryOptions.sortBy)
    }
    return url.toString()
  }

  private copyQueryOptionsForPage(
    page: number,
    queryOptions: QueryOptions
  ): QueryOptions {
    return new QueryOptions(
      page,
      queryOptions.itemCount,
      queryOptions.filterProperty,
      queryOptions.filterValues,
      queryOptions.sortBy,
      queryOptions.ascending
    )
  }
}
