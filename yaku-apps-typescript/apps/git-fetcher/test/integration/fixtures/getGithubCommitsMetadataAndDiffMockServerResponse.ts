import { MockServerOptions } from '../../../../../integration-tests/src/util'

export const githubStartCommitEndpoint =
  '/repos/aquatest/github-fetcher-test-repo/commits/afeaebf412c6d0b865a36cfdec37fdb46c0fab63'

export const githubEndCommitEndpoint =
  '/repos/aquatest/github-fetcher-test-repo/commits/8036cf75f4b7365efea76cbd716ef12d352d7d29'

export const githubDiffEndpoint =
  '/repos/aquatest/github-fetcher-test-repo/compare/afeaebf412c6d0b865a36cfdec37fdb46c0fab63...8036cf75f4b7365efea76cbd716ef12d352d7d29'

export const githubCommitsMetadataEndpoint =
  '/repos/aquatest/github-fetcher-test-repo/commits'

export function getGitCommitsMetadataAndDiffMockServerResponse(
  port: number
): MockServerOptions {
  return {
    port,
    https: true,
    responses: {
      [githubStartCommitEndpoint]: {
        get: [
          {
            responseStatus: 200,
            responseBody: {
              sha: 'afeaebf412c6d0b865a36cfdec37fdb46c0fab63',
              node_id: 'C_gnasfASGJKOGwakgawpARJWGJagja',
              commit: {
                author: {
                  name: 'Tech User',
                  email: 'tech.user@example.com',
                  date: '2023-03-06T14:11:29Z',
                },
                committer: {
                  name: 'Tech User',
                  email: 'tech.user@example.com',
                  date: '2023-03-06T14:11:29Z',
                },
                message:
                  'Add git fetcher app\n\nSigned-off-by: Tech User <tech.user@example.com>',
                tree: {
                  sha: '347a2c4dc61cb708a1067675fd6dbc1f0ea74608',
                  url: 'https://example.com/qg-apps-typescript/git/trees/347a2c4dc61cb708a1067675fd6dbc1f0ea74608',
                },
                url: 'https://example.com/qg-apps-typescript/git/commits/afeaebf412c6d0b865a36cfdec37fdb46c0fab63',
                comment_count: 0,
                verification: {
                  verified: false,
                  reason: 'unsigned',
                  signature: null,
                  payload: null,
                },
              },
              url: 'https://example.com/qg-apps-typescript/commits/afeaebf412c6d0b865a36cfdec37fdb46c0fab63',
              html_url:
                'https:/example.com/qg-apps-typescript/commit/afeaebf412c6d0b865a36cfdec37fdb46c0fab63',
              comments_url:
                'https://example.com/qg-apps-typescript/commits/afeaebf412c6d0b865a36cfdec37fdb46c0fab63/comments',
              author: {
                login: 'users/TxxxUxxGxxx',
                id: 12345678,
                node_id: 'sgsGASGJKASLJKGALWSJGag',
                avatar_url:
                  'https://avatars.githubusercontent.com/u/x12345678?v=4',
                gravatar_id: '',
                url: 'https://example.com/users/TxxxUxxGxxx',
                html_url: 'https://github.com/users/TxxxUxxGxxx',
                followers_url:
                  'https://example.com/users/TxxxUxxGxxx/followers',
                following_url:
                  'https://example.com/users/TxxxUxxGxxx/following{/other_user}',
                gists_url:
                  'https://example.com/users/TxxxUxxGxxx/gists{/gist_id}',
                starred_url:
                  'https://example.com/users/TxxxUxxGxxx/starred{/owner}{/repo}',
                subscriptions_url:
                  'https://example.com/users/TxxxUxxGxxx/subscriptions',
                organizations_url: 'https://example.com/users/TxxxUxxGxxx/orgs',
                repos_url: 'https://example.com/users/TxxxUxxGxxx/repos',
                events_url:
                  'https://example.com/users/TxxxUxxGxxx/events{/privacy}',
                received_events_url:
                  'https://example.com/users/TxxxUxxGxxx/received_events',
                type: 'User',
                site_admin: false,
              },
              committer: {
                login: 'users/TxxxUxxGxxx',
                id: 12345678,
                node_id: 'sgsGASGJKASLJKGALWSJGag',
                avatar_url:
                  'https://avatars.githubusercontent.com/u/12345678?v=4',
                gravatar_id: '',
                url: 'https://example.com/users/TxxxUxxGxxx',
                html_url: 'https://github.com/users/TxxxUxxGxxx',
                followers_url:
                  'https://example.com/users/TxxxUxxGxxx/followers',
                following_url:
                  'https://example.com/users/TxxxUxxGxxx/following{/other_user}',
                gists_url:
                  'https://example.com/users/TxxxUxxGxxx/gists{/gist_id}',
                starred_url:
                  'https://example.com/users/TxxxUxxGxxx/starred{/owner}{/repo}',
                subscriptions_url:
                  'https://example.com/users/TxxxUxxGxxx/subscriptions',
                organizations_url: 'https://example.com/users/TxxxUxxGxxx/orgs',
                repos_url: 'https://example.com/users/TxxxUxxGxxx/repos',
                events_url:
                  'https://example.com/users/TxxxUxxGxxx/events{/privacy}',
                received_events_url:
                  'https://example.com/users/TxxxUxxGxxx/received_events',
                type: 'User',
                site_admin: false,
              },
              parents: [
                {
                  sha: '097079eba1e7749d6d86d324fa530f8e89e55595',
                  url: 'https://example.com/qg-apps-typescript/commits/097079eba1e7749d6d86d324fa530f8e89e55595',
                  html_url:
                    'https:/example.com/qg-apps-typescript/commit/097079eba1e7749d6d86d324fa530f8e89e55595',
                },
              ],
              stats: {
                total: 472,
                additions: 472,
                deletions: 0,
              },
              files: [
                {
                  sha: '1715371c6198185606321fdc46678ea3c9c8e0fe',
                  filename: 'apps/git-fetcher/.env.sample',
                  status: 'added',
                  additions: 5,
                  deletions: 0,
                  changes: 5,
                  blob_url:
                    'https:/example.com/qg-apps-typescript/blob/afeaebf412c6d0b865a36cfdec37fdb46c0fab63/apps%2Fgit-fetcher%2F.env.sample',
                  raw_url:
                    'https:/example.com/qg-apps-typescript/raw/afeaebf412c6d0b865a36cfdec37fdb46c0fab63/apps%2Fgit-fetcher%2F.env.sample',
                  contents_url:
                    'https://example.com/qg-apps-typescript/contents/apps%2Fgit-fetcher%2F.env.sample?ref=afeaebf412c6d0b865a36cfdec37fdb46c0fab63',
                  patch:
                    '@@ -0,0 +1,5 @@\n+export GIT_FETCHER_SERVER_API_URL=\n+export GIT_FETCHER_SERVER_AUTH_METHOD=\n+export GIT_FETCHER_SERVER_TYPE=\n+export GIT_FETCHER_API_TOKEN=\n+export GIT_FETCHER_OUTPUT_FILE_PATH=',
                },
                {
                  sha: '0b64f27e7472ca024519e443cafc398cd51436a9',
                  filename: 'apps/git-fetcher/.eslintrc.cjs',
                  status: 'added',
                  additions: 5,
                  deletions: 0,
                  changes: 5,
                  blob_url:
                    'https:/example.com/qg-apps-typescript/blob/afeaebf412c6d0b865a36cfdec37fdb46c0fab63/apps%2Fgit-fetcher%2F.eslintrc.cjs',
                  raw_url:
                    'https:/example.com/qg-apps-typescript/raw/afeaebf412c6d0b865a36cfdec37fdb46c0fab63/apps%2Fgit-fetcher%2F.eslintrc.cjs',
                  contents_url:
                    'https://example.com/qg-apps-typescript/contents/apps%2Fgit-fetcher%2F.eslintrc.cjs?ref=afeaebf412c6d0b865a36cfdec37fdb46c0fab63',
                  patch:
                    '@@ -0,0 +1,5 @@\n+/**\n+ * Copyright (c) 2022, 2023 by grow platform GmbH \n+ */\n+\n+module.exports = require("@B-S-F/eslint-config/eslint-preset");\n\\ No newline at end of file',
                },
              ],
            },
          },
        ],
      },
      [githubEndCommitEndpoint]: {
        get: [
          {
            responseStatus: 200,
            responseBody: {
              sha: '8036cf75f4b7365efea76cbd716ef12d352d7d29',
              node_id:
                'C_kwDOJEBj4toAKDgwMzZjZjc1ZjRiNzM2NWVmZWE3NmNiZDcxNmVmMTJkMzUyZDdkMjk',
              commit: {
                author: {
                  name: 'Tech User',
                  email: 'tech.user@example.com',
                  date: '2023-07-12T10:46:50Z',
                },
                committer: {
                  name: 'Tech User',
                  email: 'tech.user@example.com',
                  date: '2023-07-12T10:46:50Z',
                },
                message:
                  'add commits and diff retrieval of target file for both bitbucket and github',
                tree: {
                  sha: '9450ecc9597185ad82f9c9b61df5337f5ad4a286',
                  url: 'https://example.com/qg-apps-typescript/git/trees/9450ecc9597185ad82f9c9b61df5337f5ad4a286',
                },
                url: 'https://example.com/qg-apps-typescript/git/commits/8036cf75f4b7365efea76cbd716ef12d352d7d29',
                comment_count: 0,
                verification: {
                  verified: false,
                  reason: 'unsigned',
                  signature: null,
                  payload: null,
                },
              },
              url: 'https://example.com/qg-apps-typescript/commits/8036cf75f4b7365efea76cbd716ef12d352d7d29',
              html_url:
                'https:/example.com/qg-apps-typescript/commit/8036cf75f4b7365efea76cbd716ef12d352d7d29',
              comments_url:
                'https://example.com/qg-apps-typescript/commits/8036cf75f4b7365efea76cbd716ef12d352d7d29/comments',
              author: {
                login: 'users/TxxxUxxGxxx',
                id: 123456789132,
                node_id: 'ASBNSABOsg6a54f',
                avatar_url:
                  'https://avatars.githubusercontent.com/u/123456789132?v=4',
                gravatar_id: '',
                url: 'https://example.com/users/TxxxUxxGxxx',
                html_url: 'https://github.com/users/TxxxUxxGxxx',
                followers_url:
                  'https://example.com/users/TxxxUxxGxxx/followers',
                following_url:
                  'https://example.com/users/TxxxUxxGxxx/following{/other_user}',
                gists_url:
                  'https://example.com/users/TxxxUxxGxxx/gists{/gist_id}',
                starred_url:
                  'https://example.com/users/TxxxUxxGxxx/starred{/owner}{/repo}',
                subscriptions_url:
                  'https://example.com/users/TxxxUxxGxxx/subscriptions',
                organizations_url: 'https://example.com/users/TxxxUxxGxxx/orgs',
                repos_url: 'https://example.com/users/TxxxUxxGxxx/repos',
                events_url:
                  'https://example.com/users/TxxxUxxGxxx/events{/privacy}',
                received_events_url:
                  'https://example.com/users/TxxxUxxGxxx/received_events',
                type: 'User',
                site_admin: false,
              },
              committer: {
                login: 'users/TxxxUxxGxxx',
                id: 987654321,
                node_id: 'XASHSDGASFGasfafs',
                avatar_url:
                  'https://avatars.githubusercontent.com/u/1236549878945?v=4',
                gravatar_id: '',
                url: 'https://example.com/users/TxxxUxxGxxx',
                html_url: 'https://example.com/users/TxxxUxxGxxx',
                followers_url:
                  'https://example.com/users/TxxxUxxGxxx/followers',
                following_url:
                  'https://example.com/users/TxxxUxxGxxx/following{/other_user}',
                gists_url:
                  'https://example.com/users/TxxxUxxGxxx/gists{/gist_id}',
                starred_url:
                  'https://example.com/users/TxxxUxxGxxx/starred{/owner}{/repo}',
                subscriptions_url:
                  'https://example.com/users/TxxxUxxGxxx/subscriptions',
                organizations_url: 'https://example.com/users/TxxxUxxGxxx/orgs',
                repos_url: 'https://example.com/users/TxxxUxxGxxx/repos',
                events_url:
                  'https://example.com/users/TxxxUxxGxxx/events{/privacy}',
                received_events_url:
                  'https://example.com/users/TxxxUxxGxxx/received_events',
                type: 'User',
                site_admin: false,
              },
              parents: [
                {
                  sha: 'dc7e626d6da5b0b4911a1b11f0d5dcf6009f827f',
                  url: 'https://example.com/qg-apps-typescript/commits/dc7e626d6da5b0b4911a1b11f0d5dcf6009f827f',
                  html_url:
                    'https:/example.com/qg-apps-typescript/commit/dc7e626d6da5b0b4911a1b11f0d5dcf6009f827f',
                },
              ],
              stats: {
                total: 210,
                additions: 208,
                deletions: 2,
              },
              files: [
                {
                  sha: '3de0f6888d7832a14dcf25eb6f080f955825a8de',
                  filename:
                    'apps/git-fetcher/src/fetchers/generate-git-fetcher.ts',
                  status: 'modified',
                  additions: 14,
                  deletions: 0,
                  changes: 14,
                  blob_url:
                    'https:/example.com/qg-apps-typescript/blob/8036cf75f4b7365efea76cbd716ef12d352d7d29/apps%2Fgit-fetcher%2Fsrc%2Ffetchers%2Fgenerate-git-fetcher.ts',
                  raw_url:
                    'https:/example.com/qg-apps-typescript/raw/8036cf75f4b7365efea76cbd716ef12d352d7d29/apps%2Fgit-fetcher%2Fsrc%2Ffetchers%2Fgenerate-git-fetcher.ts',
                  contents_url:
                    'https://example.com/qg-apps-typescript/contents/apps%2Fgit-fetcher%2Fsrc%2Ffetchers%2Fgenerate-git-fetcher.ts?ref=8036cf75f4b7365efea76cbd716ef12d352d7d29',
                  patch:
                    "@@ -1,6 +1,7 @@\n import { BitbucketPr } from '../model/bitbucket-pr.js'\n import { BitbucketBranch } from '../model/bitbucket-branch'\n import { BitbucketTag } from '../model/bitbucket-tag'\n+import { CommitsMetadataAndDiff } from '../model/bitbucket-commits-metadata-and-diff.js'\n import {\n   ConfigFileData,\n   GitConfigResource,\n@@ -15,12 +16,15 @@ import { GitFetcher } from './git-fetcher'\n import { GitFetcherBitbucketPrs } from './git-fetcher-bitbucket-prs.js'\n import { GitFetcherBitbucketTagsAndBranches } from './git-fetcher-bitbucket-tags-and-branches.js'\n import { GitFetcherGithubPrs } from './git-fetcher-github-prs.js'\n+import { GitFetcherBitbucketCommitsAndDiff } from './git-fetcher-bitbucket-commits-and-diff.js'\n+import { GitFetcherGithubCommitsAndDiff } from './git-fetcher-github-commits-and-diff.js'\n \n export type GitResource =\n   | GithubPr\n   | BitbucketPr\n   | BitbucketBranch\n   | BitbucketTag\n+  | CommitsMetadataAndDiff\n \n export function generateGitFetcher(\n   gitServerConfig: GitServerConfig,\n@@ -36,6 +40,11 @@ export function generateGitFetcher(\n     pullRequestAliases.includes(gitConfigResource)\n   ) {\n     return new GitFetcherGithubPrs(gitServerConfig, configFileData)\n+  } else if (\n+    gitServerType === 'github' &&\n+    gitConfigResource === 'metadata-and-diff'\n+  ) {\n+    return new GitFetcherGithubCommitsAndDiff(gitServerConfig, configFileData)\n   } else if (gitServerType === 'bitbucket') {\n     if (gitConfigResource === 'branches' || gitConfigResource === 'tags') {\n       return new GitFetcherBitbucketTagsAndBranches(\n@@ -45,6 +54,11 @@ export function generateGitFetcher(\n       )\n     } else if (pullRequestAliases.includes(gitConfigResource)) {\n       return new GitFetcherBitbucketPrs(gitServerConfig, configFileData)\n+    } else if (gitConfigResource === 'metadata-and-diff') {\n+      return new GitFetcherBitbucketCommitsAndDiff(\n+        gitServerConfig,\n+        configFileData\n+      )\n     }\n   }\n ",
                },
                {
                  sha: '6de16689e463732b398bd9c291ca797450216b73',
                  filename:
                    'apps/git-fetcher/src/fetchers/git-fetcher-bitbucket-commits-and-diff.ts',
                  status: 'added',
                  additions: 72,
                  deletions: 0,
                  changes: 72,
                  blob_url:
                    'https:/example.com/qg-apps-typescript/blob/8036cf75f4b7365efea76cbd716ef12d352d7d29/apps%2Fgit-fetcher%2Fsrc%2Ffetchers%2Fgit-fetcher-bitbucket-commits-and-diff.ts',
                  raw_url:
                    'https:/example.com/qg-apps-typescript/raw/8036cf75f4b7365efea76cbd716ef12d352d7d29/apps%2Fgit-fetcher%2Fsrc%2Ffetchers%2Fgit-fetcher-bitbucket-commits-and-diff.ts',
                  contents_url:
                    'https://example.com/qg-apps-typescript/contents/apps%2Fgit-fetcher%2Fsrc%2Ffetchers%2Fgit-fetcher-bitbucket-commits-and-diff.ts?ref=8036cf75f4b7365efea76cbd716ef12d352d7d29',
                  patch:
                    "@@ -0,0 +1,72 @@\n+import { CommitsMetadataAndDiff } from '../model/bitbucket-commits-metadata-and-diff'\n+import { ConfigFileData } from '../model/config-file-data'\n+import { GitServerConfig } from '../model/git-server-config'\n+import { GitFetcher } from './git-fetcher'\n+import { getRequestOptions } from './utils/get-request-options.js'\n+\n+export class GitFetcherBitbucketCommitsAndDiff\n+  implements GitFetcher<CommitsMetadataAndDiff>\n+{\n+  constructor(\n+    private readonly gitServerConfig: GitServerConfig,\n+    private readonly config: ConfigFileData\n+  ) {}\n+\n+  public async fetchResource(): Promise<CommitsMetadataAndDiff> {\n+    const requestOptions: RequestInit = await getRequestOptions(\n+      this.gitServerConfig\n+    )\n+    let result: CommitsMetadataAndDiff = {\n+      commitsMetadata: [],\n+      diff: [],\n+    }\n+    try {\n+      const serverName = this.gitServerConfig.gitServerApiUrl\n+      const projectKey = this.config.data.org\n+      const repositorySlug = this.config.data.repo\n+      const filePath = this.config.data.filePath\n+      const startHash = this.config.data.filter?.startHash\n+      let endHash = this.config.data.filter?.endHash\n+      if (!filePath) {\n+        throw new Error(\n+          `Please define the 'filePath' parameter in the config and try again`\n+        )\n+      }\n+      if (!startHash) {\n+        throw new Error(\n+          `Please define the 'filter.startHash' parameter in the config and try again`\n+        )\n+      }\n+      if (!endHash) {\n+        endHash = 'master'\n+      }\n+      let startPage = 0\n+      let responseBody\n+      do {\n+        let commitsUrl = `${serverName}/projects/${projectKey}/repos/${repositorySlug}/commits?path=${filePath}&until=${endHash}&start=${startPage}`\n+        if (startHash) {\n+          commitsUrl = commitsUrl + `&since=${startHash}`\n+        }\n+        let response: Response = await fetch(commitsUrl, requestOptions)\n+        responseBody = await response.json()\n+        result.commitsMetadata = result.commitsMetadata.concat(\n+          responseBody.values\n+        )\n+        startPage = responseBody.nextPageStart ?? 0\n+      } while (!responseBody.isLastPage)\n+\n+      let diffUrl = `${serverName}/projects/${projectKey}/repos/${repositorySlug}/diff/${filePath}?&until=${endHash}`\n+\n+      if (startHash) {\n+        diffUrl = diffUrl + `&since=${startHash}`\n+      }\n+\n+      let response: Response = await fetch(diffUrl, requestOptions)\n+      responseBody = await response.json()\n+      result.diff = responseBody.diffs\n+    } catch (error: any) {\n+      throw new Error(`bitbucket commits and diffs: ${error.message}`)\n+    }\n+    return result\n+  }\n+}",
                },
              ],
            },
          },
        ],
      },
      [githubDiffEndpoint]: {
        get: [
          {
            responseStatus: 200,
            responseBody: {
              url: 'https://example.com/qg-apps-typescript/compare/afeaebf412c6d0b865a36cfdec37fdb46c0fab63...8036cf75f4b7365efea76cbd716ef12d352d7d29',
              html_url:
                'https:/example.com/qg-apps-typescript/compare/afeaebf412c6d0b865a36cfdec37fdb46c0fab63...8036cf75f4b7365efea76cbd716ef12d352d7d29',
              permalink_url:
                'https:/example.com/qg-apps-typescript/compare/B-S-F:afeaebf...B-S-F:8036cf7',
              diff_url:
                'https:/example.com/qg-apps-typescript/compare/afeaebf412c6d0b865a36cfdec37fdb46c0fab63...8036cf75f4b7365efea76cbd716ef12d352d7d29.diff',
              patch_url:
                'https:/example.com/qg-apps-typescript/compare/afeaebf412c6d0b865a36cfdec37fdb46c0fab63...8036cf75f4b7365efea76cbd716ef12d352d7d29.patch',
              base_commit: {
                sha: 'afeaebf412c6d0b865a36cfdec37fdb46c0fab63',
                node_id: 'C_gnasfASGJKOGwakgawpARJWGJagja',
                commit: {
                  author: {
                    name: 'Tech User',
                    email: 'tech.user@example.com',
                    date: '2023-03-06T14:11:29Z',
                  },
                  committer: {
                    name: 'Tech User',
                    email: 'tech.user@example.com',
                    date: '2023-03-06T14:11:29Z',
                  },
                  message:
                    'Add git fetcher app\n\nSigned-off-by: Tech User <tech.user@example.com>',
                  tree: {
                    sha: '347a2c4dc61cb708a1067675fd6dbc1f0ea74608',
                    url: 'https://example.com/qg-apps-typescript/git/trees/347a2c4dc61cb708a1067675fd6dbc1f0ea74608',
                  },
                  url: 'https://example.com/qg-apps-typescript/git/commits/afeaebf412c6d0b865a36cfdec37fdb46c0fab63',
                  comment_count: 0,
                  verification: {
                    verified: false,
                    reason: 'unsigned',
                    signature: null,
                    payload: null,
                  },
                },
                url: 'https://example.com/qg-apps-typescript/commits/afeaebf412c6d0b865a36cfdec37fdb46c0fab63',
                html_url:
                  'https:/example.com/qg-apps-typescript/commit/afeaebf412c6d0b865a36cfdec37fdb46c0fab63',
                comments_url:
                  'https://example.com/qg-apps-typescript/commits/afeaebf412c6d0b865a36cfdec37fdb46c0fab63/comments',
                author: {
                  login: 'users/TxxxUxxGxxx',
                  id: 12345678,
                  node_id: 'sgsGASGJKASLJKGALWSJGag',
                  avatar_url:
                    'https://avatars.githubusercontent.com/u/12345678?v=4',
                  gravatar_id: '',
                  url: 'https://example.com/users/TxxxUxxGxxx',
                  html_url: 'https://github.com/users/TxxxUxxGxxx',
                  followers_url:
                    'https://example.com/users/TxxxUxxGxxx/followers',
                  following_url:
                    'https://example.com/users/TxxxUxxGxxx/following{/other_user}',
                  gists_url:
                    'https://example.com/users/TxxxUxxGxxx/gists{/gist_id}',
                  starred_url:
                    'https://example.com/users/TxxxUxxGxxx/starred{/owner}{/repo}',
                  subscriptions_url:
                    'https://example.com/users/TxxxUxxGxxx/subscriptions',
                  organizations_url:
                    'https://example.com/users/TxxxUxxGxxx/orgs',
                  repos_url: 'https://example.com/users/TxxxUxxGxxx/repos',
                  events_url:
                    'https://example.com/users/TxxxUxxGxxx/events{/privacy}',
                  received_events_url:
                    'https://example.com/users/TxxxUxxGxxx/received_events',
                  type: 'User',
                  site_admin: false,
                },
                committer: {
                  login: 'users/TxxxUxxGxxx',
                  id: 12345678,
                  node_id: 'sgsGASGJKASLJKGALWSJGag',
                  avatar_url:
                    'https://avatars.githubusercontent.com/u/12345678?v=4',
                  gravatar_id: '',
                  url: 'https://example.com/users/TxxxUxxGxxx',
                  html_url: 'https://github.com/users/TxxxUxxGxxx',
                  followers_url:
                    'https://example.com/users/TxxxUxxGxxx/followers',
                  following_url:
                    'https://example.com/users/TxxxUxxGxxx/following{/other_user}',
                  gists_url:
                    'https://example.com/users/TxxxUxxGxxx/gists{/gist_id}',
                  starred_url:
                    'https://example.com/users/TxxxUxxGxxx/starred{/owner}{/repo}',
                  subscriptions_url:
                    'https://example.com/users/TxxxUxxGxxx/subscriptions',
                  organizations_url:
                    'https://example.com/users/TxxxUxxGxxx/orgs',
                  repos_url: 'https://example.com/users/TxxxUxxGxxx/repos',
                  events_url:
                    'https://example.com/users/TxxxUxxGxxx/events{/privacy}',
                  received_events_url:
                    'https://example.com/users/TxxxUxxGxxx/received_events',
                  type: 'User',
                  site_admin: false,
                },
                parents: [
                  {
                    sha: '097079eba1e7749d6d86d324fa530f8e89e55595',
                    url: 'https://example.com/qg-apps-typescript/commits/097079eba1e7749d6d86d324fa530f8e89e55595',
                    html_url:
                      'https:/example.com/qg-apps-typescript/commit/097079eba1e7749d6d86d324fa530f8e89e55595',
                  },
                ],
              },
              merge_base_commit: {
                sha: 'afeaebf412c6d0b865a36cfdec37fdb46c0fab63',
                node_id: 'C_gnasfASGJKOGwakgawpARJWGJagja',
                commit: {
                  author: {
                    name: 'Tech User',
                    email: 'tech.user@example.com',
                    date: '2023-03-06T14:11:29Z',
                  },
                  committer: {
                    name: 'Tech User',
                    email: 'tech.user@example.com',
                    date: '2023-03-06T14:11:29Z',
                  },
                  message:
                    'Add git fetcher app\n\nSigned-off-by: Tech User <tech.user@example.com>',
                  tree: {
                    sha: '347a2c4dc61cb708a1067675fd6dbc1f0ea74608',
                    url: 'https://example.com/qg-apps-typescript/git/trees/347a2c4dc61cb708a1067675fd6dbc1f0ea74608',
                  },
                  url: 'https://example.com/qg-apps-typescript/git/commits/afeaebf412c6d0b865a36cfdec37fdb46c0fab63',
                  comment_count: 0,
                  verification: {
                    verified: false,
                    reason: 'unsigned',
                    signature: null,
                    payload: null,
                  },
                },
                url: 'https://example.com/qg-apps-typescript/commits/afeaebf412c6d0b865a36cfdec37fdb46c0fab63',
                html_url:
                  'https:/example.com/qg-apps-typescript/commit/afeaebf412c6d0b865a36cfdec37fdb46c0fab63',
                comments_url:
                  'https://example.com/qg-apps-typescript/commits/afeaebf412c6d0b865a36cfdec37fdb46c0fab63/comments',
                author: {
                  login: 'users/TxxxUxxGxxx',
                  id: 12345678,
                  node_id: 'sgsGASGJKASLJKGALWSJGag',
                  avatar_url:
                    'https://avatars.githubusercontent.com/u/12345678?v=4',
                  gravatar_id: '',
                  url: 'https://example.com/users/TxxxUxxGxxx',
                  html_url: 'https://github.com/users/TxxxUxxGxxx',
                  followers_url:
                    'https://example.com/users/TxxxUxxGxxx/followers',
                  following_url:
                    'https://example.com/users/TxxxUxxGxxx/following{/other_user}',
                  gists_url:
                    'https://example.com/users/TxxxUxxGxxx/gists{/gist_id}',
                  starred_url:
                    'https://example.com/users/TxxxUxxGxxx/starred{/owner}{/repo}',
                  subscriptions_url:
                    'https://example.com/users/TxxxUxxGxxx/subscriptions',
                  organizations_url:
                    'https://example.com/users/TxxxUxxGxxx/orgs',
                  repos_url: 'https://example.com/users/TxxxUxxGxxx/repos',
                  events_url:
                    'https://example.com/users/TxxxUxxGxxx/events{/privacy}',
                  received_events_url:
                    'https://example.com/users/TxxxUxxGxxx/received_events',
                  type: 'User',
                  site_admin: false,
                },
                committer: {
                  login: 'users/TxxxUxxGxxx',
                  id: 12345678,
                  node_id: 'sgsGASGJKASLJKGALWSJGag',
                  avatar_url:
                    'https://avatars.githubusercontent.com/u/12345678?v=4',
                  gravatar_id: '',
                  url: 'https://example.com/users/TxxxUxxGxxx',
                  html_url: 'https://github.com/users/TxxxUxxGxxx',
                  followers_url:
                    'https://example.com/users/TxxxUxxGxxx/followers',
                  following_url:
                    'https://example.com/users/TxxxUxxGxxx/following{/other_user}',
                  gists_url:
                    'https://example.com/users/TxxxUxxGxxx/gists{/gist_id}',
                  starred_url:
                    'https://example.com/users/TxxxUxxGxxx/starred{/owner}{/repo}',
                  subscriptions_url:
                    'https://example.com/users/TxxxUxxGxxx/subscriptions',
                  organizations_url:
                    'https://example.com/users/TxxxUxxGxxx/orgs',
                  repos_url: 'https://example.com/users/TxxxUxxGxxx/repos',
                  events_url:
                    'https://example.com/users/TxxxUxxGxxx/events{/privacy}',
                  received_events_url:
                    'https://example.com/users/TxxxUxxGxxx/received_events',
                  type: 'User',
                  site_admin: false,
                },
                parents: [
                  {
                    sha: '097079eba1e7749d6d86d324fa530f8e89e55595',
                    url: 'https://example.com/qg-apps-typescript/commits/097079eba1e7749d6d86d324fa530f8e89e55595',
                    html_url:
                      'https:/example.com/qg-apps-typescript/commit/097079eba1e7749d6d86d324fa530f8e89e55595',
                  },
                ],
              },
              status: 'ahead',
              ahead_by: 324,
              behind_by: 0,
              total_commits: 324,
              commits: [
                {
                  sha: 'fbf45173f2c1fbf4f6f2439abba88946a2cc8360',
                  node_id: 'C_abcdefghIJKLMNOPQrstuvqABCDEFGHIJKLmnopqrstu123',
                  commit: {
                    author: {
                      name: 'Tech User',
                      email: 'tech.user@example.com',
                      date: '2023-03-06T14:15:43Z',
                    },
                    committer: {
                      name: 'Tech User',
                      email: 'tech.user@example.com',
                      date: '2023-03-06T14:15:43Z',
                    },
                    message:
                      'Add oneq-finalizer and git-fetcher to release workflow\n\nSigned-off-by: Tech User <tech.user@example.com>',
                    tree: {
                      sha: '84152e149262f4883b1c724d9c9bb8e4e5d23fad',
                      url: 'https://example.com/qg-apps-typescript/git/trees/84152e149262f4883b1c724d9c9bb8e4e5d23fad',
                    },
                    url: 'https://example.com/qg-apps-typescript/git/commits/fbf45173f2c1fbf4f6f2439abba88946a2cc8360',
                    comment_count: 0,
                    verification: {
                      verified: false,
                      reason: 'unsigned',
                      signature: null,
                      payload: null,
                    },
                  },
                  url: 'https://example.com/qg-apps-typescript/commits/fbf45173f2c1fbf4f6f2439abba88946a2cc8360',
                  html_url:
                    'https:/example.com/qg-apps-typescript/commit/fbf45173f2c1fbf4f6f2439abba88946a2cc8360',
                  comments_url:
                    'https://example.com/qg-apps-typescript/commits/fbf45173f2c1fbf4f6f2439abba88946a2cc8360/comments',
                  author: {
                    login: 'users/TxxxUxxGxxx',
                    id: 12345678,
                    node_id: 'sgsGASGJKASLJKGALWSJGag',
                    avatar_url:
                      'https://avatars.githubusercontent.com/u/12345678?v=4',
                    gravatar_id: '',
                    url: 'https://example.com/users/TxxxUxxGxxx',
                    html_url: 'https://github.com/users/TxxxUxxGxxx',
                    followers_url:
                      'https://example.com/users/TxxxUxxGxxx/followers',
                    following_url:
                      'https://example.com/users/TxxxUxxGxxx/following{/other_user}',
                    gists_url:
                      'https://example.com/users/TxxxUxxGxxx/gists{/gist_id}',
                    starred_url:
                      'https://example.com/users/TxxxUxxGxxx/starred{/owner}{/repo}',
                    subscriptions_url:
                      'https://example.com/users/TxxxUxxGxxx/subscriptions',
                    organizations_url:
                      'https://example.com/users/TxxxUxxGxxx/orgs',
                    repos_url: 'https://example.com/users/TxxxUxxGxxx/repos',
                    events_url:
                      'https://example.com/users/TxxxUxxGxxx/events{/privacy}',
                    received_events_url:
                      'https://example.com/users/TxxxUxxGxxx/received_events',
                    type: 'User',
                    site_admin: false,
                  },
                  committer: {
                    login: 'users/TxxxUxxGxxx',
                    id: 12345678,
                    node_id: 'sgsGASGJKASLJKGALWSJGag',
                    avatar_url:
                      'https://avatars.githubusercontent.com/u/12345678?v=4',
                    gravatar_id: '',
                    url: 'https://example.com/users/TxxxUxxGxxx',
                    html_url: 'https://github.com/users/TxxxUxxGxxx',
                    followers_url:
                      'https://example.com/users/TxxxUxxGxxx/followers',
                    following_url:
                      'https://example.com/users/TxxxUxxGxxx/following{/other_user}',
                    gists_url:
                      'https://example.com/users/TxxxUxxGxxx/gists{/gist_id}',
                    starred_url:
                      'https://example.com/users/TxxxUxxGxxx/starred{/owner}{/repo}',
                    subscriptions_url:
                      'https://example.com/users/TxxxUxxGxxx/subscriptions',
                    organizations_url:
                      'https://example.com/users/TxxxUxxGxxx/orgs',
                    repos_url: 'https://example.com/users/TxxxUxxGxxx/repos',
                    events_url:
                      'https://example.com/users/TxxxUxxGxxx/events{/privacy}',
                    received_events_url:
                      'https://example.com/users/TxxxUxxGxxx/received_events',
                    type: 'User',
                    site_admin: false,
                  },
                  parents: [
                    {
                      sha: 'afeaebf412c6d0b865a36cfdec37fdb46c0fab63',
                      url: 'https://example.com/qg-apps-typescript/commits/afeaebf412c6d0b865a36cfdec37fdb46c0fab63',
                      html_url:
                        'https:/example.com/qg-apps-typescript/commit/afeaebf412c6d0b865a36cfdec37fdb46c0fab63',
                    },
                  ],
                },
              ],
              files: [
                {
                  sha: 'ab49e18dfe46bfe03d9fa77837cff8ccd175de53',
                  filename:
                    'apps/git-fetcher/src/fetchers/git-fetcher-github-prs.ts',
                  status: 'added',
                  additions: 106,
                  deletions: 0,
                  changes: 106,
                  blob_url:
                    'https:/example.com/qg-apps-typescript/blob/8036cf75f4b7365efea76cbd716ef12d352d7d29/apps%2Fgit-fetcher%2Fsrc%2Ffetchers%2Fgit-fetcher-github-prs.ts',
                  raw_url:
                    'https:/example.com/qg-apps-typescript/raw/8036cf75f4b7365efea76cbd716ef12d352d7d29/apps%2Fgit-fetcher%2Fsrc%2Ffetchers%2Fgit-fetcher-github-prs.ts',
                  contents_url:
                    'https://example.com/qg-apps-typescript/contents/apps%2Fgit-fetcher%2Fsrc%2Ffetchers%2Fgit-fetcher-github-prs.ts?ref=8036cf75f4b7365efea76cbd716ef12d352d7d29',
                  patch:
                    "@@ -0,0 +1,106 @@\n+import { GitFetcher } from './git-fetcher'\n+import { handleResponseStatus } from '../utils/handle-response-status.js'\n+import { getRequestOptions } from './utils/get-request-options.js'\n+import { GitServerConfig } from '../model/git-server-config.js'\n+import { ConfigFileData } from '../model/config-file-data.js'\n+import { compareLabels } from '../utils/compare-labels.js'\n+import { GithubPr } from '../model/github-pr'\n+\n+/**\n+ * @description Creates a GitFetcher which is able to fetch pull requests from GitHub\n+ */\n+export class GitFetcherGithubPrs implements GitFetcher<GithubPr> {\n+  /**\n+   * @constructor\n+   * @param {GitServerConfig} gitServerConfig\n+   * @param {ConfigFileData} config\n+   */\n+  constructor(\n+    private gitServerConfig: GitServerConfig,\n+    private config: ConfigFileData\n+  ) {}\n+\n+  /**\n+   * Builds the request url as well as the request options to fetch pull requests from GitHub\n+   * and calls the fetch-method. As long as the response body includes pull requests objects, the\n+   * currentPage variable will be incremented and pull requests are pushed to the array, that's eventually\n+   * returned. If the response body is empty and no pull requests were received, the loop ends,\n+   * and the collected pull requests are returned.\n+   * @returns an a promise for an array of GitHub pull requests, which have been filtered according to the configuration.\n+   * @throws {Error} when either fetch response is not successful or response can't be parsed.\n+   */\n+  public async fetchResource(): Promise<GithubPr[]> {\n+    const requestOptions: RequestInit = await getRequestOptions(\n+      this.gitServerConfig\n+    )\n+\n+    let pullRequests: GithubPr[] = []\n+\n+    let currentPage: number | null = 1\n+    let responseBody: GithubPr[]\n+\n+    while (currentPage != null) {\n+      try {\n+        const response: Response = await fetch(\n+          this.composeUrl(currentPage),\n+          requestOptions\n+        )\n+\n+        if (response.status != 200) {\n+          handleResponseStatus(response.status)\n+        }\n+\n+        responseBody = (await response.json()) as GithubPr[]\n+      } catch (error: any) {\n+        throw new Error(\n+          `Got the following error when running git fetcher: ${error.message}`\n+        )\n+      }\n+\n+      if (responseBody.length > 0) {\n+        pullRequests.push(...responseBody)\n+        currentPage++\n+      } else {\n+        currentPage = null\n+      }\n+    }\n+\n+    if (\n+      pullRequests.length > 0 &&\n+      this.config.data.labels &&\n+      this.config.data.labels.length > 0\n+    ) {\n+      const filteredPrs: GithubPr[] = []\n+\n+      pullRequests.forEach((pr: GithubPr) => {\n+        if (compareLabels(this.config.data.labels, pr.labels)) {\n+          filteredPrs.push(pr)\n+        }\n+      })\n+\n+      pullRequests = filteredPrs\n+    }\n+\n+    console.log(\n+      `Fetched ${pullRequests.length} pull request${\n+        pullRequests.length === 1 ? '' : 's'\n+      }`\n+    )\n+    return pullRequests\n+  }\n+\n+  private composeUrl(startPage?: number): string {\n+    const strippedApiUrl: string = this.gitServerConfig.gitServerApiUrl.replace(\n+      //*$/,\n+      ''\n+    )\n+    const stateFilter = 'all' //will allow to set other state filters, introduced in future tickets\n+\n+    let baseUrl = `${strippedApiUrl}/repos/${this.config.data.org}/${this.config.data.repo}/pulls?state=${stateFilter}&per_page=100`\n+    if (startPage != null) {\n+      baseUrl += `&page=${startPage}`\n+    }\n+\n+    return baseUrl\n+  }\n+}",
                },
                {
                  sha: '73491746fc3d4c675726060b73df7dd8ccf72309',
                  filename: 'apps/git-fetcher/src/fetchers/git-fetcher.ts',
                  status: 'modified',
                  additions: 2,
                  deletions: 98,
                  changes: 100,
                  blob_url:
                    'https:/example.com/qg-apps-typescript/blob/8036cf75f4b7365efea76cbd716ef12d352d7d29/apps%2Fgit-fetcher%2Fsrc%2Ffetchers%2Fgit-fetcher.ts',
                  raw_url:
                    'https:/example.com/qg-apps-typescript/raw/8036cf75f4b7365efea76cbd716ef12d352d7d29/apps%2Fgit-fetcher%2Fsrc%2Ffetchers%2Fgit-fetcher.ts',
                  contents_url:
                    'https://example.com/qg-apps-typescript/contents/apps%2Fgit-fetcher%2Fsrc%2Ffetchers%2Fgit-fetcher.ts?ref=8036cf75f4b7365efea76cbd716ef12d352d7d29',
                  patch:
                    "@@ -1,99 +1,3 @@\n-import { GitServerConfig } from '../model/git-server-config'\n-import { ConfigFileData } from '../model/config-file-data'\n-import { handleResponseStatus } from '../utils/handle-response-status.js'\n-\n-export class GitFetcher {\n-  constructor(public env: GitServerConfig, public config: ConfigFileData) {}\n-\n-  public pullRequestValidInputs = [\n-    'pull-request',\n-    'pull-requests',\n-    'pr',\n-    'prs',\n-    'pullrequest',\n-    'pullrequests',\n-    'pull',\n-    'pulls',\n-  ]\n-\n-  public validateResourceName(resource: string) {\n-    if (this.env.gitServerType == 'bitbucket') {\n-      if (this.pullRequestValidInputs.includes(resource.toLocaleLowerCase())) {\n-        return 'pull-requests'\n-      } else {\n-        throw new Error(`${resource} resource name not valid`)\n-      }\n-    } else if (this.env.gitServerType == 'github') {\n-      if (this.pullRequestValidInputs.includes(resource.toLocaleLowerCase())) {\n-        return 'pulls'\n-      } else {\n-        throw new Error(`${resource} resource name not valid`)\n-      }\n-    } else {\n-      throw new Error(`${this.env.gitServerType} server type not supported`)\n-    }\n-  }\n-\n-  public async getOptions() {\n-    if (this.env.gitServerAuthMethod.toLocaleLowerCase() == 'basic') {\n-      const options = {\n-        method: 'GET',\n-        auth: {\n-          username: this.env.gitServerUsername,\n-          password: this.env.gitServerPassword,\n-        },\n-        headers: {\n-          Accept: 'application/vnd.github+json',\n-        },\n-      }\n-      return options\n-    } else if (this.env.gitServerAuthMethod.toLocaleLowerCase() == 'token') {\n-      const options = {\n-        method: 'GET',\n-        headers: {\n-          Accept: 'application/json',\n-          Authorization: `Bearer ${this.env.gitServerApiToken}`,\n-        },\n-      }\n-      return options\n-    } else {\n-      throw new Error('No valid auth method provided')\n-    }\n-  }\n-\n-  public async buildUrl(resource: string) {\n-    const resourceName = this.validateResourceName(resource)\n-    if (this.env.gitServerType == 'bitbucket') {\n-      const endpoint = `${this.env.gitServerApiUrl.replace(\n-        //*$/,\n-        ''\n-      )}/projects/${this.config.data.org}/repos/${\n-        this.config.data.repo\n-      }/${resourceName}?state=ALL`\n-      return endpoint\n-    } else if (this.env.gitServerType == 'github') {\n-      const endpoint = `${this.env.gitServerApiUrl.replace(//*$/, '')}/repos/${\n-        this.config.data.org\n-      }/${this.config.data.repo}/${resourceName}?state=all&per_page=100`\n-      return endpoint\n-    } else {\n-      throw new Error(`${this.env.gitServerType} server type not supported`)\n-    }\n-  }\n-\n-  public async runQuery() {\n-    const url = await this.buildUrl(this.config.data.resource)\n-    const options = await this.getOptions()\n-    try {\n-      const response = await fetch(url, options)\n-      if (response.status != 200) {\n-        handleResponseStatus(response.status)\n-      }\n-      return response.json()\n-    } catch (error: any) {\n-      throw new Error(\n-        `Got the following error when running Git fetcher: ${error.message}`\n-      )\n-    }\n-  }\n+export interface GitFetcher<T> {\n+  fetchResource(): Promise<T[] | T>\n }",
                },
                {
                  sha: '62e232b894cc96e6bfb3be758e94e1ac57df1b99',
                  filename: 'apps/git-fetcher/src/fetchers/index.ts',
                  status: 'added',
                  additions: 2,
                  deletions: 0,
                  changes: 2,
                  blob_url:
                    'https:/example.com/qg-apps-typescript/blob/8036cf75f4b7365efea76cbd716ef12d352d7d29/apps%2Fgit-fetcher%2Fsrc%2Ffetchers%2Findex.ts',
                  raw_url:
                    'https:/example.com/qg-apps-typescript/raw/8036cf75f4b7365efea76cbd716ef12d352d7d29/apps%2Fgit-fetcher%2Fsrc%2Ffetchers%2Findex.ts',
                  contents_url:
                    'https://example.com/qg-apps-typescript/contents/apps%2Fgit-fetcher%2Fsrc%2Ffetchers%2Findex.ts?ref=8036cf75f4b7365efea76cbd716ef12d352d7d29',
                  patch:
                    "@@ -0,0 +1,2 @@\n+export * from './git-fetcher.js'\n+export * from './generate-git-fetcher.js'",
                },
              ],
            },
          },
        ],
      },
      [githubCommitsMetadataEndpoint]: {
        get: [
          {
            responseStatus: 200,
            responseBody: [
              {
                sha: '8036cf75f4b7365efea76cbd716ef12d352d7d29',
                node_id:
                  'C_kgsakASFGKOGJASOGJKwaogjowakxxxkls12345awkrKgasjkgsakgp',
                commit: {
                  author: {
                    name: 'Tech User',
                    email: 'tech.user@example.com',
                    date: '2023-07-12T10:46:50Z',
                  },
                  committer: {
                    name: 'Tech User',
                    email: 'tech.user@example.com',
                    date: '2023-07-12T10:46:50Z',
                  },
                  message:
                    'add commits and diff retrieval of target file for both bitbucket and github',
                  tree: {
                    sha: '9450ecc9597185ad82f9c9b61df5337f5ad4a286',
                    url: 'https://example.com/qg-apps-typescript/git/trees/9450ecc9597185ad82f9c9b61df5337f5ad4a286',
                  },
                  url: 'https://example.com/qg-apps-typescript/git/commits/8036cf75f4b7365efea76cbd716ef12d352d7d29',
                  comment_count: 0,
                  verification: {
                    verified: false,
                    reason: 'unsigned',
                    signature: null,
                    payload: null,
                  },
                },
                url: 'https://example.com/qg-apps-typescript/commits/8036cf75f4b7365efea76cbd716ef12d352d7d29',
                html_url:
                  'https:/example.com/qg-apps-typescript/commit/8036cf75f4b7365efea76cbd716ef12d352d7d29',
                comments_url:
                  'https://example.com/qg-apps-typescript/commits/8036cf75f4b7365efea76cbd716ef12d352d7d29/comments',
                author: {
                  login: 'users/TxxxUxxGxxx',
                  id: 123456789,
                  node_id: 'XjlwaKGAKSFGAgasg',
                  avatar_url:
                    'https://avatars.githubusercontent.com/u/123456789132?v=4',
                  gravatar_id: '',
                  url: 'https://example.com/users/TxxxUxxGxxx',
                  html_url: 'https://github.com/users/TxxxUxxGxxx',
                  followers_url:
                    'https://example.com/users/TxxxUxxGxxx/followers',
                  following_url:
                    'https://example.com/users/TxxxUxxGxxx/following{/other_user}',
                  gists_url:
                    'https://example.com/users/TxxxUxxGxxx/gists{/gist_id}',
                  starred_url:
                    'https://example.com/users/TxxxUxxGxxx/starred{/owner}{/repo}',
                  subscriptions_url:
                    'https://example.com/users/TxxxUxxGxxx/subscriptions',
                  organizations_url:
                    'https://example.com/users/TxxxUxxGxxx/orgs',
                  repos_url: 'https://example.com/users/TxxxUxxGxxx/repos',
                  events_url:
                    'https://example.com/users/TxxxUxxGxxx/events{/privacy}',
                  received_events_url:
                    'https://example.com/users/TxxxUxxGxxx/received_events',
                  type: 'User',
                  site_admin: false,
                },
                committer: {
                  login: 'users/TxxxUxxGxxx',
                  id: 123456789132,
                  node_id: 'ASBNSABOsg6a5',
                  avatar_url:
                    'https://avatars.githubusercontent.com/u/123456789132?v=4',
                  gravatar_id: '',
                  url: 'https://example.com/users/TxxxUxxGxxx',
                  html_url: 'https://github.com/users/TxxxUxxGxxx',
                  followers_url:
                    'https://example.com/users/TxxxUxxGxxx/followers',
                  following_url:
                    'https://example.com/users/TxxxUxxGxxx/following{/other_user}',
                  gists_url:
                    'https://example.com/users/TxxxUxxGxxx/gists{/gist_id}',
                  starred_url:
                    'https://example.com/users/TxxxUxxGxxx/starred{/owner}{/repo}',
                  subscriptions_url:
                    'https://example.com/users/TxxxUxxGxxx/subscriptions',
                  organizations_url:
                    'https://example.com/users/TxxxUxxGxxx/orgs',
                  repos_url: 'https://example.com/users/TxxxUxxGxxx/repos',
                  events_url:
                    'https://example.com/users/TxxxUxxGxxx/events{/privacy}',
                  received_events_url:
                    'https://example.com/users/TxxxUxxGxxx/received_events',
                  type: 'User',
                  site_admin: false,
                },
                parents: [
                  {
                    sha: 'dc7e626d6da5b0b4911a1b11f0d5dcf6009f827f',
                    url: 'https://example.com/qg-apps-typescript/commits/dc7e626d6da5b0b4911a1b11f0d5dcf6009f827f',
                    html_url:
                      'https:/example.com/qg-apps-typescript/commit/dc7e626d6da5b0b4911a1b11f0d5dcf6009f827f',
                  },
                ],
              },
              {
                sha: '8cf0dafa2bfcc3104aa0d69ae7cf9ff55ceab8cd',
                node_id: 'C_asgaswqrojopwajgjagishjaijoarkwa',
                commit: {
                  author: {
                    name: 'Tech User',
                    email: 'tech.user@example.com',
                    date: '2023-05-31T07:20:01Z',
                  },
                  committer: {
                    name: 'Tech User',
                    email: 'tech.user@example.com',
                    date: '2023-06-14T12:05:11Z',
                  },
                  message:
                    'Add functionality for fetching branches and tags from bitbucket',
                  tree: {
                    sha: '1a2539623b501741ccec196ad673071570a35dbe',
                    url: 'https://example.com/qg-apps-typescript/git/trees/1a2539623b501741ccec196ad673071570a35dbe',
                  },
                  url: 'https://example.com/qg-apps-typescript/git/commits/8cf0dafa2bfcc3104aa0d69ae7cf9ff55ceab8cd',
                  comment_count: 0,
                  verification: {
                    verified: false,
                    reason: 'unsigned',
                    signature: null,
                    payload: null,
                  },
                },
                url: 'https://example.com/qg-apps-typescript/commits/8cf0dafa2bfcc3104aa0d69ae7cf9ff55ceab8cd',
                html_url:
                  'https:/example.com/qg-apps-typescript/commit/8cf0dafa2bfcc3104aa0d69ae7cf9ff55ceab8cd',
                comments_url:
                  'https://example.com/qg-apps-typescript/commits/8cf0dafa2bfcc3104aa0d69ae7cf9ff55ceab8cd/comments',
                author: {
                  login: 'users/TxxxUxxGxxx',
                  id: 123456789123,
                  node_id: 'U_ab5dasEGh48',
                  avatar_url:
                    'https://avatars.githubusercontent.com/u/123456789123?v=4',
                  gravatar_id: '',
                  url: 'https://example.com/users/TxxxUxxGxxx',
                  html_url: 'https://github.com/users/TxxxUxxGxxx',
                  followers_url:
                    'https://example.com/users/TxxxUxxGxxx/followers',
                  following_url:
                    'https://example.com/users/TxxxUxxGxxx/following{/other_user}',
                  gists_url:
                    'https://example.com/users/TxxxUxxGxxx/gists{/gist_id}',
                  starred_url:
                    'https://example.com/users/TxxxUxxGxxx/starred{/owner}{/repo}',
                  subscriptions_url:
                    'https://example.com/users/TxxxUxxGxxx/subscriptions',
                  organizations_url:
                    'https://example.com/users/TxxxUxxGxxx/orgs',
                  repos_url: 'https://example.com/users/TxxxUxxGxxx/repos',
                  events_url:
                    'https://example.com/users/TxxxUxxGxxx/events{/privacy}',
                  received_events_url:
                    'https://example.com/users/TxxxUxxGxxx/received_events',
                  type: 'User',
                  site_admin: false,
                },
                committer: {
                  login: 'users/TxxxUxxGxxx',
                  id: 123456789123,
                  node_id: 'U_ab5dasEGh48',
                  avatar_url:
                    'https://avatars.githubusercontent.com/u/123456789123?v=4',
                  gravatar_id: '',
                  url: 'https://example.com/users/TxxxUxxGxxx',
                  html_url: 'https://github.com/users/TxxxUxxGxxx',
                  followers_url:
                    'https://example.com/users/TxxxUxxGxxx/followers',
                  following_url:
                    'https://example.com/users/TxxxUxxGxxx/following{/other_user}',
                  gists_url:
                    'https://example.com/users/TxxxUxxGxxx/gists{/gist_id}',
                  starred_url:
                    'https://example.com/users/TxxxUxxGxxx/starred{/owner}{/repo}',
                  subscriptions_url:
                    'https://example.com/users/TxxxUxxGxxx/subscriptions',
                  organizations_url:
                    'https://example.com/users/TxxxUxxGxxx/orgs',
                  repos_url: 'https://example.com/users/TxxxUxxGxxx/repos',
                  events_url:
                    'https://example.com/users/TxxxUxxGxxx/events{/privacy}',
                  received_events_url:
                    'https://example.com/users/TxxxUxxGxxx/received_events',
                  type: 'User',
                  site_admin: false,
                },
                parents: [
                  {
                    sha: '2f6d4472f7114cbacb6770fdabaa21b9e8e100aa',
                    url: 'https://example.com/qg-apps-typescript/commits/2f6d4472f7114cbacb6770fdabaa21b9e8e100aa',
                    html_url:
                      'https:/example.com/qg-apps-typescript/commit/2f6d4472f7114cbacb6770fdabaa21b9e8e100aa',
                  },
                ],
              },
            ],
          },
          {
            responseStatus: 200,
            responseBody: [
              {
                sha: 'd6a73ae06e781fe510090dc58f33cc7bcf8c9c11',
                node_id: 'C_ksagkglwajklgfjkwoaggjksidkgjsgjskok12345JKT',
                commit: {
                  author: {
                    name: 'Tech User',
                    email: 'tech.user@example.com',
                    date: '2023-05-17T14:22:46Z',
                  },
                  committer: {
                    name: 'Tech User',
                    email: 'tech.user@example.com',
                    date: '2023-05-30T12:48:08Z',
                  },
                  message:
                    'Adjust gitFetcher to fetch all pull requests and ignore pagination or limits.',
                  tree: {
                    sha: 'd7950bd787096772a6cabde0b24fd4c68ca3aa77',
                    url: 'https://example.com/qg-apps-typescript/git/trees/d7950bd787096772a6cabde0b24fd4c68ca3aa77',
                  },
                  url: 'https://example.com/qg-apps-typescript/git/commits/d6a73ae06e781fe510090dc58f33cc7bcf8c9c11',
                  comment_count: 0,
                  verification: {
                    verified: false,
                    reason: 'unsigned',
                    signature: null,
                    payload: null,
                  },
                },
                url: 'https://example.com/qg-apps-typescript/commits/d6a73ae06e781fe510090dc58f33cc7bcf8c9c11',
                html_url:
                  'https:/example.com/qg-apps-typescript/commit/d6a73ae06e781fe510090dc58f33cc7bcf8c9c11',
                comments_url:
                  'https://example.com/qg-apps-typescript/commits/d6a73ae06e781fe510090dc58f33cc7bcf8c9c11/comments',
                author: {
                  login: 'users/TxxxUxxGxxx',
                  id: 12345647865456416,
                  node_id: 'U_kshgsioajaRgashjg',
                  avatar_url:
                    'https://avatars.githubusercontent.com/u/12345647865456416?v=4',
                  gravatar_id: '',
                  url: 'https://example.com/users/TxxxUxxGxxx',
                  html_url: 'https://github.com/users/TxxxUxxGxxx',
                  followers_url:
                    'https://example.com/users/TxxxUxxGxxx/followers',
                  following_url:
                    'https://example.com/users/TxxxUxxGxxx/following{/other_user}',
                  gists_url:
                    'https://example.com/users/TxxxUxxGxxx/gists{/gist_id}',
                  starred_url:
                    'https://example.com/users/TxxxUxxGxxx/starred{/owner}{/repo}',
                  subscriptions_url:
                    'https://example.com/users/TxxxUxxGxxx/subscriptions',
                  organizations_url:
                    'https://example.com/users/TxxxUxxGxxx/orgs',
                  repos_url: 'https://example.com/users/TxxxUxxGxxx/repos',
                  events_url:
                    'https://example.com/users/TxxxUxxGxxx/events{/privacy}',
                  received_events_url:
                    'https://example.com/users/TxxxUxxGxxx/received_events',
                  type: 'User',
                  site_admin: false,
                },
                committer: {
                  login: 'users/TxxxUxxGxxx',
                  id: 12345647865456416,
                  node_id: 'U_kshgsioajaRgashjg',
                  avatar_url:
                    'https://avatars.githubusercontent.com/u/12345647865456416?v=4',
                  gravatar_id: '',
                  url: 'https://example.com/users/TxxxUxxGxxx',
                  html_url: 'https://github.com/users/TxxxUxxGxxx',
                  followers_url:
                    'https://example.com/users/TxxxUxxGxxx/followers',
                  following_url:
                    'https://example.com/users/TxxxUxxGxxx/following{/other_user}',
                  gists_url:
                    'https://example.com/users/TxxxUxxGxxx/gists{/gist_id}',
                  starred_url:
                    'https://example.com/users/TxxxUxxGxxx/starred{/owner}{/repo}',
                  subscriptions_url:
                    'https://example.com/users/TxxxUxxGxxx/subscriptions',
                  organizations_url:
                    'https://example.com/users/TxxxUxxGxxx/orgs',
                  repos_url: 'https://example.com/users/TxxxUxxGxxx/repos',
                  events_url:
                    'https://example.com/users/TxxxUxxGxxx/events{/privacy}',
                  received_events_url:
                    'https://example.com/users/TxxxUxxGxxx/received_events',
                  type: 'User',
                  site_admin: false,
                },
                parents: [
                  {
                    sha: '8d59a30e6fbbd75320695c46c7221bab9fe07424',
                    url: 'https://example.com/qg-apps-typescript/commits/8d59a30e6fbbd75320695c46c7221bab9fe07424',
                    html_url:
                      'https:/example.com/qg-apps-typescript/commit/8d59a30e6fbbd75320695c46c7221bab9fe07424',
                  },
                ],
              },
              {
                sha: '70c52ff0011d60ded7d438463ad44945306ddc7f',
                node_id: 'C_kwD21245gsaglkjoaslsjaASHGSAGIAmbsdtr',
                commit: {
                  author: {
                    name: 'Tech User',
                    email: 'tech.user@example.com',
                    date: '2023-04-18T14:54:22Z',
                  },
                  committer: {
                    name: 'Tech User',
                    email: 'tech.user@example.com',
                    date: '2023-04-28T11:27:36Z',
                  },
                  message: 'Validate git fetcher input values',
                  tree: {
                    sha: '2f147a29812c08781b5be7eb01d7267fb1b157e7',
                    url: 'https://example.com/qg-apps-typescript/git/trees/2f147a29812c08781b5be7eb01d7267fb1b157e7',
                  },
                  url: 'https://example.com/qg-apps-typescript/git/commits/70c52ff0011d60ded7d438463ad44945306ddc7f',
                  comment_count: 0,
                  verification: {
                    verified: false,
                    reason: 'unsigned',
                    signature: null,
                    payload: null,
                  },
                },
                url: 'https://example.com/qg-apps-typescript/commits/70c52ff0011d60ded7d438463ad44945306ddc7f',
                html_url:
                  'https:/example.com/qg-apps-typescript/commit/70c52ff0011d60ded7d438463ad44945306ddc7f',
                comments_url:
                  'https://example.com/qg-apps-typescript/commits/70c52ff0011d60ded7d438463ad44945306ddc7f/comments',
                author: {
                  login: 'users/TxxxUxxGxxx',
                  id: 65498712345,
                  node_id: 'U_kgDOcasf',
                  avatar_url:
                    'https://avatars.githubusercontent.com/u/65498712345?v=4',
                  gravatar_id: '',
                  url: 'https://example.com/users/TxxxUxxGxxx',
                  html_url: 'https://github.com/users/TxxxUxxGxxx',
                  followers_url:
                    'https://example.com/users/TxxxUxxGxxx/followers',
                  following_url:
                    'https://example.com/users/TxxxUxxGxxx/following{/other_user}',
                  gists_url:
                    'https://example.com/users/TxxxUxxGxxx/gists{/gist_id}',
                  starred_url:
                    'https://example.com/users/TxxxUxxGxxx/starred{/owner}{/repo}',
                  subscriptions_url:
                    'https://example.com/users/TxxxUxxGxxx/subscriptions',
                  organizations_url:
                    'https://example.com/users/TxxxUxxGxxx/orgs',
                  repos_url: 'https://example.com/users/TxxxUxxGxxx/repos',
                  events_url:
                    'https://example.com/users/TxxxUxxGxxx/events{/privacy}',
                  received_events_url:
                    'https://example.com/users/TxxxUxxGxxx/received_events',
                  type: 'User',
                  site_admin: false,
                },
                committer: {
                  login: 'users/TxxxUxxGxxx',
                  id: 123456789123,
                  node_id: 'U_ab5dasEGh48',
                  avatar_url:
                    'https://avatars.githubusercontent.com/u/123456789123?v=4',
                  gravatar_id: '',
                  url: 'https://example.com/users/TxxxUxxGxxx',
                  html_url: 'https://github.com/users/TxxxUxxGxxx',
                  followers_url:
                    'https://example.com/users/TxxxUxxGxxx/followers',
                  following_url:
                    'https://example.com/users/TxxxUxxGxxx/following{/other_user}',
                  gists_url:
                    'https://example.com/users/TxxxUxxGxxx/gists{/gist_id}',
                  starred_url:
                    'https://example.com/users/TxxxUxxGxxx/starred{/owner}{/repo}',
                  subscriptions_url:
                    'https://example.com/users/TxxxUxxGxxx/subscriptions',
                  organizations_url:
                    'https://example.com/users/TxxxUxxGxxx/orgs',
                  repos_url: 'https://example.com/users/TxxxUxxGxxx/repos',
                  events_url:
                    'https://example.com/users/TxxxUxxGxxx/events{/privacy}',
                  received_events_url:
                    'https://example.com/users/TxxxUxxGxxx/received_events',
                  type: 'User',
                  site_admin: false,
                },
                parents: [
                  {
                    sha: 'cc0a150e8c5585f6212abab78ceaf8bc2b4f94c1',
                    url: 'https://example.com/qg-apps-typescript/commits/cc0a150e8c5585f6212abab78ceaf8bc2b4f94c1',
                    html_url:
                      'https:/example.com/qg-apps-typescript/commit/cc0a150e8c5585f6212abab78ceaf8bc2b4f94c1',
                  },
                ],
              },
            ],
          },
          {
            responseStatus: 200,
            responseBody: [
              {
                sha: '92aa336413904e67151b6625dbaeb3fbe01ef132',
                node_id: 'C_kaujsgjghsjaGAJSgasgwakfgawRGAJsagasKa21fasfg',
                commit: {
                  author: {
                    name: 'Tech User',
                    email: 'tech.user@example.com',
                    date: '2023-03-20T15:03:41Z',
                  },
                  committer: {
                    name: 'Tech User',
                    email: 'tech.user@example.com',
                    date: '2023-03-20T15:03:41Z',
                  },
                  message:
                    'Improve log and error messages for better user readability + minor code clean up',
                  tree: {
                    sha: '97fe2161887bd14518dea8fbf308d5165b03987d',
                    url: 'https://example.com/qg-apps-typescript/git/trees/97fe2161887bd14518dea8fbf308d5165b03987d',
                  },
                  url: 'https://example.com/qg-apps-typescript/git/commits/92aa336413904e67151b6625dbaeb3fbe01ef132',
                  comment_count: 0,
                  verification: {
                    verified: false,
                    reason: 'unsigned',
                    signature: null,
                    payload: null,
                  },
                },
                url: 'https://example.com/qg-apps-typescript/commits/92aa336413904e67151b6625dbaeb3fbe01ef132',
                html_url:
                  'https:/example.com/qg-apps-typescript/commit/92aa336413904e67151b6625dbaeb3fbe01ef132',
                comments_url:
                  'https://example.com/qg-apps-typescript/commits/92aa336413904e67151b6625dbaeb3fbe01ef132/comments',
                author: {
                  login: 'users/TxxxUxxGxxx',
                  id: 98745631215486,
                  node_id: 'U_kg235352fasg2',
                  avatar_url:
                    'https://avatars.githubusercontent.com/u/98745631215486?v=4',
                  gravatar_id: '',
                  url: 'https://example.com/users/TxxxUxxGxxx',
                  html_url: 'https://github.com/users/TxxxUxxGxxx',
                  followers_url:
                    'https://example.com/users/TxxxUxxGxxx/followers',
                  following_url:
                    'https://example.com/users/TxxxUxxGxxx/following{/other_user}',
                  gists_url:
                    'https://example.com/users/TxxxUxxGxxx/gists{/gist_id}',
                  starred_url:
                    'https://example.com/users/TxxxUxxGxxx/starred{/owner}{/repo}',
                  subscriptions_url:
                    'https://example.com/users/TxxxUxxGxxx/subscriptions',
                  organizations_url:
                    'https://example.com/users/TxxxUxxGxxx/orgs',
                  repos_url: 'https://example.com/users/TxxxUxxGxxx/repos',
                  events_url:
                    'https://example.com/users/TxxxUxxGxxx/events{/privacy}',
                  received_events_url:
                    'https://example.com/users/TxxxUxxGxxx/received_events',
                  type: 'User',
                  site_admin: false,
                },
                committer: {
                  login: 'users/TxxxUxxGxxx',
                  id: 98745631215486,
                  node_id: 'U_kg235352fasg2',
                  avatar_url:
                    'https://avatars.githubusercontent.com/u/98745631215486?v=4',
                  gravatar_id: '',
                  url: 'https://example.com/users/TxxxUxxGxxx',
                  html_url: 'https://github.com/users/TxxxUxxGxxx',
                  followers_url:
                    'https://example.com/users/TxxxUxxGxxx/followers',
                  following_url:
                    'https://example.com/users/TxxxUxxGxxx/following{/other_user}',
                  gists_url:
                    'https://example.com/users/TxxxUxxGxxx/gists{/gist_id}',
                  starred_url:
                    'https://example.com/users/TxxxUxxGxxx/starred{/owner}{/repo}',
                  subscriptions_url:
                    'https://example.com/users/TxxxUxxGxxx/subscriptions',
                  organizations_url:
                    'https://example.com/users/TxxxUxxGxxx/orgs',
                  repos_url: 'https://example.com/users/TxxxUxxGxxx/repos',
                  events_url:
                    'https://example.com/users/TxxxUxxGxxx/events{/privacy}',
                  received_events_url:
                    'https://example.com/users/TxxxUxxGxxx/received_events',
                  type: 'User',
                  site_admin: false,
                },
                parents: [
                  {
                    sha: '1f0f928abc84ba2d51b0da0cb40f4388d4a60f27',
                    url: 'https://example.com/qg-apps-typescript/commits/1f0f928abc84ba2d51b0da0cb40f4388d4a60f27',
                    html_url:
                      'https:/example.com/qg-apps-typescript/commit/1f0f928abc84ba2d51b0da0cb40f4388d4a60f27',
                  },
                ],
              },
            ],
          },
          {
            responseStatus: 200,
            responseBody: [],
          },
        ],
      },
    },
  }
}

export function getGitCommitsMetadataAndDiffErrorMockServerResponse(
  port: number
): MockServerOptions {
  return {
    port,
    https: true,
    responses: {
      [githubStartCommitEndpoint]: {
        get: {
          responseStatus: 404,
        },
      },
    },
  }
}
