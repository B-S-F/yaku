// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { CommitsMetadataAndDiff } from '../model/commits-metadata-and-diff'
import { ConfigFileData } from '../model/config-file-data'
import { GitServerConfig } from '../model/git-server-config'
import { ConfigurationError } from '../run.js'
import { tryParseResponse } from '../utils/error-handling-helper.js'
import { handleResponseStatus } from '../utils/handle-response-status.js'
import { GitFetcher } from './git-fetcher'
import { getRequestOptions } from './utils/get-request-options.js'

export class GitFetcherBitbucketCommitsAndDiff
  implements GitFetcher<CommitsMetadataAndDiff>
{
  constructor(
    private readonly gitServerConfig: GitServerConfig,
    private readonly config: ConfigFileData
  ) {}

  private stripUrl = (url: string) => {
    return url.replace(/\/*$/, '')
  }

  public async fetchResource(): Promise<CommitsMetadataAndDiff> {
    const requestOptions: RequestInit = await getRequestOptions(
      this.gitServerConfig
    )
    const result: CommitsMetadataAndDiff = {
      commitsMetadata: [],
      diff: [],
    }
    try {
      const serverName = this.stripUrl(this.gitServerConfig.gitServerApiUrl)
      const projectKey = this.config.data.org
      const repositorySlug = this.config.data.repo
      const filePath = this.config.data.filePath
      const startHash = this.config.data.filter?.startHash
      let endHash = this.config.data.filter?.endHash
      if (!filePath) {
        throw new ConfigurationError(
          `Please define the 'filePath' parameter in the config and try again`
        )
      }
      if (!startHash) {
        throw new ConfigurationError(
          `Please define the 'filter.startHash' parameter in the config and try again`
        )
      }
      if (!endHash) {
        endHash = 'master'
      }
      let startPage = 0
      let responseBody
      do {
        const commitsUrl = `${serverName}/projects/${projectKey}/repos/${repositorySlug}/commits?path=${filePath}&since=${startHash}&until=${endHash}&start=${startPage}`
        const response: Response = await fetch(commitsUrl, requestOptions)
        if (response.status != 200) {
          handleResponseStatus(response.status)
        }
        responseBody = await tryParseResponse(response)
        result.commitsMetadata = result.commitsMetadata.concat(
          responseBody.values
        )
        startPage = responseBody.nextPageStart ?? 0
      } while (!responseBody.isLastPage)

      console.log(
        `Fetched medata about ${result.commitsMetadata.length} commits`
      )

      const diffUrl = `${serverName}/projects/${projectKey}/repos/${repositorySlug}/diff/${filePath}?since=${startHash}&until=${endHash}`
      const response: Response = await fetch(diffUrl, requestOptions)
      if (response.status != 200) {
        handleResponseStatus(response.status)
      }
      responseBody = await tryParseResponse(response)
      result.diff = responseBody.diffs

      console.log(`Fetched ${result.diff.length} diff`)
    } catch (error: any) {
      throw new Error(error.message)
    }
    return result
  }
}
