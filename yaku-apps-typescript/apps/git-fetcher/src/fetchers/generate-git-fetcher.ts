import { BitbucketBranch } from '../model/bitbucket-branch'
import { BitbucketPr } from '../model/bitbucket-pr.js'
import { BitbucketTag } from '../model/bitbucket-tag'
import { CommitsMetadataAndDiff } from '../model/commits-metadata-and-diff.js'
import {
  ConfigFileData,
  GitConfigResource,
  gitFetcherPullRequests,
} from '../model/config-file-data.js'
import {
  GitServerConfig,
  SupportedGitServerType,
} from '../model/git-server-config.js'
import { GithubPr } from '../model/github-pr.js'
import { ConfigurationError } from '../run.js'
import { GitFetcher } from './git-fetcher'
import { GitFetcherBitbucketCommitsAndDiff } from './git-fetcher-bitbucket-commits-and-diff.js'
import { GitFetcherBitbucketPrs } from './git-fetcher-bitbucket-prs.js'
import { GitFetcherBitbucketTagsAndBranches } from './git-fetcher-bitbucket-tags-and-branches.js'
import { GitFetcherGithubCommitsAndDiff } from './git-fetcher-github-commits-and-diff.js'
import { GitFetcherGithubPrs } from './git-fetcher-github-prs.js'

export type GitResource =
  | GithubPr
  | BitbucketPr
  | BitbucketBranch
  | BitbucketTag
  | CommitsMetadataAndDiff

export default function generateGitFetcher(
  gitServerConfig: GitServerConfig,
  configFileData: ConfigFileData,
): GitFetcher<GitResource> {
  const gitServerType: SupportedGitServerType = gitServerConfig.gitServerType
  const gitConfigResource: GitConfigResource = configFileData.data.resource
  const pullRequestAliases: string[] =
    gitFetcherPullRequests as unknown as string[]

  if (
    gitServerType === 'github' &&
    pullRequestAliases.includes(gitConfigResource)
  ) {
    return new GitFetcherGithubPrs(gitServerConfig, configFileData)
  } else if (
    gitServerType === 'github' &&
    gitConfigResource === 'metadata-and-diff'
  ) {
    return new GitFetcherGithubCommitsAndDiff(gitServerConfig, configFileData)
  } else if (gitServerType === 'bitbucket') {
    if (gitConfigResource === 'branches' || gitConfigResource === 'tags') {
      return new GitFetcherBitbucketTagsAndBranches(
        gitServerConfig,
        configFileData,
        gitConfigResource,
      )
    } else if (pullRequestAliases.includes(gitConfigResource)) {
      return new GitFetcherBitbucketPrs(gitServerConfig, configFileData)
    } else if (gitConfigResource === 'metadata-and-diff') {
      return new GitFetcherBitbucketCommitsAndDiff(
        gitServerConfig,
        configFileData,
      )
    }
  }

  throw new ConfigurationError(
    `Unsupported git server / git resource combination: ${gitServerType}/${gitConfigResource}`,
  )
}
