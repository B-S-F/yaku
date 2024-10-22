import { BitbucketBranch } from '../model/bitbucket-branch'
import { BitbucketResponse } from '../model/bitbucket-response.js'
import { BitbucketTag } from '../model/bitbucket-tag'
import { ConfigFileData } from '../model/config-file-data.js'
import { GitServerConfig } from '../model/git-server-config.js'
import { tryParseResponse } from '../utils/error-handling-helper.js'
import { handleResponseStatus } from '../utils/handle-response-status.js'
import { GitFetcher } from './git-fetcher'
import { getRequestOptions } from './utils/get-request-options.js'

export class GitFetcherBitbucketTagsAndBranches
  implements GitFetcher<BitbucketTag | BitbucketBranch>
{
  private readonly url: string

  constructor(
    private readonly gitServerConfig: GitServerConfig,
    private readonly config: ConfigFileData,
    private readonly resourceType: 'tags' | 'branches'
  ) {
    const strippedApiUrl: string = gitServerConfig.gitServerApiUrl.replace(
      /\/*$/,
      ''
    )
    this.url = `${strippedApiUrl}/projects/${this.config.data.org}/repos/${this.config.data.repo}/${resourceType}`
  }

  public async fetchResource(): Promise<(BitbucketTag | BitbucketBranch)[]> {
    const requestOptions: RequestInit = await getRequestOptions(
      this.gitServerConfig
    )
    const fetchedResources: (BitbucketTag | BitbucketBranch)[] = []

    let startPage = 0
    let response: Response
    let responseBody: BitbucketResponse<BitbucketTag | BitbucketBranch>

    do {
      response = await fetch(`${this.url}?start=${startPage}`, requestOptions)
      if (response.status !== 200) {
        handleResponseStatus(response.status)
      }
      responseBody = (await tryParseResponse(response)) as BitbucketResponse<
        BitbucketTag | BitbucketBranch
      >
      fetchedResources.push(...responseBody.values)
      startPage = responseBody.nextPageStart ?? 0
    } while (!responseBody.isLastPage)

    let resource = ''
    let postfix = ''
    if (this.resourceType === 'branches') {
      resource = 'branch'
      postfix = 'es'
    } else if (this.resourceType === 'tags') {
      resource = 'tag'
      postfix = 's'
    }

    console.log(
      `Fetched ${fetchedResources.length} ${resource}${
        fetchedResources.length === 1 ? '' : postfix
      }`
    )
    return fetchedResources
  }
}
