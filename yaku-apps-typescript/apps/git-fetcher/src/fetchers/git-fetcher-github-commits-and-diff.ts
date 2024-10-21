import { CommitsMetadataAndDiff } from '../model/commits-metadata-and-diff'
import { ConfigFileData } from '../model/config-file-data'
import { GitServerConfig } from '../model/git-server-config'
import { ConfigurationError } from '../run.js'
import { tryParseResponse } from '../utils/error-handling-helper.js'
import { handleResponseStatus } from '../utils/handle-response-status.js'
import { GitFetcher } from './git-fetcher'
import { getRequestOptions } from './utils/get-request-options.js'

export class GitFetcherGithubCommitsAndDiff
  implements GitFetcher<CommitsMetadataAndDiff>
{
  constructor(
    private readonly gitServerConfig: GitServerConfig,
    private readonly config: ConfigFileData
  ) {}

  private stripUrl = (url: string) => {
    return url.replace(/\/*$/, '')
  }

  private incrementSecondsAndReturnIsoFormat = (startDate: string) => {
    const newDate = new Date(
      new Date(startDate).setUTCSeconds(new Date(startDate).getUTCSeconds() + 1)
    )
    return (
      newDate.getUTCFullYear() +
      '-' +
      (newDate.getUTCMonth() + 1) +
      '-' +
      newDate.getUTCDate() +
      'T' +
      newDate.getUTCHours() +
      ':' +
      newDate.getUTCMinutes() +
      ':' +
      newDate.getUTCSeconds() +
      'Z'
    )
  }

  public async fetchResource(): Promise<CommitsMetadataAndDiff> {
    const requestOptions: RequestInit = await getRequestOptions(
      this.gitServerConfig
    )
    const result: CommitsMetadataAndDiff = {
      commitsMetadata: [],
      diff: {
        linesAdded: [],
        linesRemoved: [],
      },
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
      let startDate
      const startCommitUrl = `${serverName}/repos/${projectKey}/${repositorySlug}/commits/${startHash}`
      let response: Response = await fetch(startCommitUrl, requestOptions)
      if (response.status != 200) {
        handleResponseStatus(response.status)
      }
      let responseBody = await tryParseResponse(response)
      startDate = responseBody.commit.committer.date

      console.log(`Fetched metadata about starting commit at ${startDate}`)

      //function below is required in order to have consistency between the '/compare' and '/commits' API calls
      startDate = this.incrementSecondsAndReturnIsoFormat(startDate)

      if (!endHash) {
        endHash = 'master'
      }

      const endCommitUrl = `${serverName}/repos/${projectKey}/${repositorySlug}/commits/${endHash}`
      response = await fetch(endCommitUrl, requestOptions)
      if (response.status != 200) {
        handleResponseStatus(response.status)
      }
      responseBody = await tryParseResponse(response)
      const endDate = responseBody.commit.committer.date

      console.log(`Fetched metadata about ending commit at ${endDate}`)

      //?page=1&per_page=1 is required in order to force the request to return only the data we are interested in,
      //which can decrease the response returned by tens of thousands of lines (19284 lines reduced in tested example)
      const diffUrl = `${serverName}/repos/${projectKey}/${repositorySlug}/compare/${startHash}...${endHash}?page=1&per_page=1`
      response = await fetch(diffUrl, requestOptions)
      if (response.status != 200) {
        handleResponseStatus(response.status)
      }
      responseBody = await tryParseResponse(response)

      for (const file of responseBody.files) {
        if (file.filename === filePath) {
          const linesAdded = file.patch.match(/\n\+[\S\s]*?(?=\n)/g)
          result.diff['linesAdded'] = linesAdded

          const linesRemoved = file.patch.match(/\n-[\S\s]*?(?=\n)/g)
          result.diff['linesRemoved'] = linesRemoved
          break
        }
      }

      console.log(
        `Fetched ${result.diff['linesAdded'].length} lines added and ${result.diff['linesRemoved'].length} lines removed`
      )

      let currentPage: number | null = 1
      while (currentPage != null) {
        const commitsUrl = `${serverName}/repos/${projectKey}/${repositorySlug}/commits?path=${filePath}&since=${startDate}&until=${endDate}&page=${currentPage}&per_page=100`
        const response: Response = await fetch(commitsUrl, requestOptions)
        if (response.status != 200) {
          handleResponseStatus(response.status)
        }
        const responseBody = await tryParseResponse(response)

        if (responseBody.length > 0) {
          for (const data of responseBody) {
            result.commitsMetadata.push(data.commit)
          }
          currentPage = currentPage + 1
        } else {
          currentPage = null
        }
      }
      console.log(
        `Fetched metadata about ${result.commitsMetadata.length} commits`
      )
    } catch (error: any) {
      throw new Error(error.message)
    }
    return result
  }
}
