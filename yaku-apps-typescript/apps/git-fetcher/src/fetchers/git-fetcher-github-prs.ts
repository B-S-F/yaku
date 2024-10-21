import { ConfigFileData } from '../model/config-file-data.js'
import { GitServerConfig } from '../model/git-server-config.js'
import { GithubPr } from '../model/github-pr'
import { compareLabels } from '../utils/compare-labels.js'
import { tryParseResponse } from '../utils/error-handling-helper.js'
import { handleResponseStatus } from '../utils/handle-response-status.js'
import { GitFetcher } from './git-fetcher'
import { getRequestOptions } from './utils/get-request-options.js'

/**
 * @description Creates a GitFetcher which is able to fetch pull requests from GitHub
 */
export class GitFetcherGithubPrs implements GitFetcher<GithubPr> {
  /**
   * @constructor
   * @param {GitServerConfig} gitServerConfig
   * @param {ConfigFileData} config
   */
  constructor(
    private gitServerConfig: GitServerConfig,
    private config: ConfigFileData
  ) {}

  /**
   * Builds the request url as well as the request options to fetch pull requests from GitHub
   * and calls the fetch-method. As long as the response body includes pull requests objects, the
   * currentPage variable will be incremented and pull requests are pushed to the array, that's eventually
   * returned. If the response body is empty and no pull requests were received, the loop ends,
   * and the collected pull requests are returned.
   * @returns an a promise for an array of GitHub pull requests, which have been filtered according to the configuration.
   * @throws {Error} when either fetch response is not successful or response can't be parsed.
   */
  public async fetchResource(): Promise<GithubPr[]> {
    const requestOptions: RequestInit = await getRequestOptions(
      this.gitServerConfig
    )

    let pullRequests: GithubPr[] = []

    let currentPage: number | null = 1
    let responseBody: GithubPr[]

    while (currentPage != null) {
      const response: Response = await fetch(
        this.composeUrl(currentPage),
        requestOptions
      )

      if (response.status != 200) {
        handleResponseStatus(response.status)
      }

      responseBody = (await tryParseResponse(response)) as GithubPr[]

      if (responseBody.length > 0) {
        pullRequests.push(...responseBody)
        currentPage++
      } else {
        currentPage = null
      }
    }

    if (
      pullRequests.length > 0 &&
      this.config.data.labels &&
      this.config.data.labels.length > 0
    ) {
      const filteredPrs: GithubPr[] = []

      pullRequests.forEach((pr: GithubPr) => {
        if (compareLabels(this.config.data.labels, pr.labels)) {
          filteredPrs.push(pr)
        }
      })

      pullRequests = filteredPrs
    }

    console.log(
      `Fetched ${pullRequests.length} pull request${
        pullRequests.length === 1 ? '' : 's'
      }`
    )
    return pullRequests
  }

  private composeUrl(startPage?: number): string {
    const strippedApiUrl: string = this.gitServerConfig.gitServerApiUrl.replace(
      /\/*$/,
      ''
    )
    const stateFilter = 'all' //will allow to set other state filters, introduced in future tickets

    let baseUrl = `${strippedApiUrl}/repos/${this.config.data.org}/${this.config.data.repo}/pulls?state=${stateFilter}&per_page=100`
    if (startPage != null) {
      baseUrl += `&page=${startPage}`
    }

    return baseUrl
  }
}
