import { BitbucketCommit } from '../model/bitbucket-commit'
import { BitbucketPr } from '../model/bitbucket-pr'
import { BitbucketResponse } from '../model/bitbucket-response'
import { BitbucketTag } from '../model/bitbucket-tag'
import {
  AllowedFilterStateType,
  ConfigFileData,
  DateFilter,
  HashFilter,
  TagFilter,
} from '../model/config-file-data.js'
import { GitServerConfig } from '../model/git-server-config.js'
import { ConfigurationError } from '../run.js'
import { tryParseResponse } from '../utils/error-handling-helper.js'
import { handleResponseStatus } from '../utils/handle-response-status.js'
import { GitFetcher } from './git-fetcher'
import { getRequestOptions } from './utils/get-request-options.js'

/**
 * @description Creates a GitFetcher which is able to fetch pull requests from Bitbucket
 */
export class GitFetcherBitbucketPrs implements GitFetcher<BitbucketPr> {
  private readonly strippedApiUrl: string

  /**
   * @constructor
   * @param {GitServerConfig} gitServerConfig
   * @param {ConfigFileData} config
   */
  constructor(
    private gitServerConfig: GitServerConfig,
    private config: ConfigFileData
  ) {
    this.strippedApiUrl = this.gitServerConfig.gitServerApiUrl.replace(
      /\/*$/,
      ''
    )
  }

  /**
   * Builds the request url as well as the request options to fetch pull requests from Bitbucket
   * and calls the fetch-method. The fetch method is called as long as the response body's attribute
   * 'isLastPage' is false. During every iteration, the fetched pull requests are pushed to an array
   * that is returned, after the last iteration. After each iteration, the 'startPage' value increments, in
   * accordance to the 'nextPageStart' attribute.In case a date filter is provided, the response
   * is first filtered and then the filtered pull requests get pushed to the array.
   * @returns an a promise for array of BitBucket pull requests, which have been filtered according to the configuration.
   * @throws {Error} when either fetch response is not successful or response can't be parsed.
   */
  public async fetchResource(): Promise<BitbucketPr[]> {
    const requestOptions: RequestInit = await getRequestOptions(
      this.gitServerConfig
    )
    let pullRequests: BitbucketPr[] = []

    let currentPage: number | null = 0
    let responseBody: BitbucketResponse<BitbucketPr>

    do {
      const response: Response = await fetch(
        this.composePrUrl(this.config.data.filter?.state, currentPage ?? 0),
        requestOptions
      )

      if (response.status != 200) {
        handleResponseStatus(response.status)
      }

      responseBody = (await tryParseResponse(
        response
      )) as BitbucketResponse<BitbucketPr>

      pullRequests.push(...responseBody.values)
      currentPage = responseBody.nextPageStart ?? null
    } while (!responseBody.isLastPage)

    if (this.config.data.filter?.startTag) {
      pullRequests = await this.filterPullRequestsByTag(
        pullRequests,
        this.config.data.filter
      )
    } else if (this.config.data.filter?.startHash) {
      pullRequests = await this.filterPullRequestsByHash(
        pullRequests,
        this.config.data.filter
      )
    } else if (this.config.data.filter?.startDate) {
      pullRequests = this.filterPullRequestsByDate(
        pullRequests,
        this.config.data.filter
      )
    }

    console.log(
      `Fetched ${pullRequests.length} pull request${
        pullRequests.length === 1 ? '' : 's'
      }`
    )
    return pullRequests
  }

  private composePrUrl(
    stateFilter: AllowedFilterStateType = 'ALL',
    startPage?: number
  ): string {
    let baseUrl = `${this.strippedApiUrl}/projects/${this.config.data.org}/repos/${this.config.data.repo}/pull-requests?state=${stateFilter}`

    if (startPage != null) {
      baseUrl += `&start=${startPage}`
    }

    return baseUrl
  }

  private composeCommitUrl(hashValue: string): string {
    return `${this.strippedApiUrl}/projects/${this.config.data.org}/repos/${this.config.data.repo}/commits/${hashValue}`
  }

  private composeTagUrl(tagName: string): string {
    return `${this.strippedApiUrl}/projects/${this.config.data.org}/repos/${this.config.data.repo}/tags/${tagName}`
  }

  private filterPullRequestsByDate(
    prs: BitbucketPr[],
    dateFilter: DateFilter
  ): BitbucketPr[] {
    const startDateInMs = dateFilter.startDate!.getTime()
    const endDateInMs = dateFilter.endDate
      ? dateFilter.endDate.getTime()
      : Date.now()

    return prs.filter(
      (pr) => pr.updatedDate >= startDateInMs && pr.updatedDate <= endDateInMs
    )
  }

  private async filterPullRequestsByTag(
    prs: BitbucketPr[],
    tagFilter: TagFilter
  ): Promise<BitbucketPr[]> {
    const dateFilter: DateFilter = await this.tagToDateFilter(tagFilter)
    return this.filterPullRequestsByDate(prs, dateFilter)
  }

  private async filterPullRequestsByHash(
    prs: BitbucketPr[],
    hashFilter: HashFilter
  ): Promise<BitbucketPr[]> {
    const dateFilter: DateFilter = await this.hashToDateFilter(hashFilter)
    return this.filterPullRequestsByDate(prs, dateFilter)
  }

  private async hashToDateFilter(hashFilter: HashFilter): Promise<DateFilter> {
    const committerTimestamps: number[] = []

    const hashesToFilter: string[] = [hashFilter.startHash!]
    if (hashFilter.endHash != null) {
      hashesToFilter.push(hashFilter.endHash)
    } else {
      // now is the default if no endHash is given
      committerTimestamps.push(Date.now())
    }

    let bitbucketCommit: BitbucketCommit
    for (const hashValue of hashesToFilter) {
      bitbucketCommit = await this.fetchCommit(hashValue)
      committerTimestamps.push(bitbucketCommit.committerTimestamp)
    }

    // sort ascending
    committerTimestamps.sort()

    return {
      startDate: new Date(committerTimestamps[0]),
      endDate: new Date(committerTimestamps[1]),
    }
  }

  private async tagToDateFilter(tagFilter: TagFilter): Promise<DateFilter> {
    if (tagFilter.startTag === undefined) {
      return {}
    }

    const startDate: Date = await this.tagNameToDate(tagFilter.startTag)
    const endDate: Date | undefined =
      tagFilter.endTag !== undefined
        ? await this.tagNameToDate(tagFilter.endTag)
        : undefined

    return {
      startDate,
      endDate,
    }
  }

  private async fetchCommit(hashValue: string): Promise<BitbucketCommit> {
    const requestOptions: RequestInit = await getRequestOptions(
      this.gitServerConfig
    )
    const response: Response = await fetch(
      this.composeCommitUrl(hashValue),
      requestOptions
    )
    if (response.status !== 200) {
      throw new ConfigurationError(
        `Could not retrieve the commit hash ${hashValue} (status ${response.status})`
      )
    }
    return (await tryParseResponse(response)) as BitbucketCommit
  }

  private async fetchTag(tagName: string): Promise<BitbucketTag> {
    const requestOptions: RequestInit = await getRequestOptions(
      this.gitServerConfig
    )
    const response: Response = await fetch(
      this.composeTagUrl(tagName),
      requestOptions
    )
    if (response.status !== 200) {
      throw new ConfigurationError(`Could not retrieve the tag ${tagName}`)
    }
    return (await tryParseResponse(response)) as BitbucketTag
  }

  private async tagNameToDate(tagName: string): Promise<Date> {
    const tag: BitbucketTag = await this.fetchTag(tagName)
    const commit: BitbucketCommit = await this.fetchCommit(tag.latestCommit)
    return new Date(commit.committerTimestamp)
  }
}
