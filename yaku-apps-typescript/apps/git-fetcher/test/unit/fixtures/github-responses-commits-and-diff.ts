import { GithubSingleCommitResponse } from '../../../src/model/github-single-commit-response'
import { GithubDiffResponse } from '../../../src/model/github-diff-response'
import { GithubMultipleCommitsResponse } from '../../../src/model/github-multiple-commits-response'

export const githubStartCommitResponse: GithubSingleCommitResponse = {
  sha: 'afeaebf412c6d0b865a36cfdec37fdb46c0fab63',
  node_id:
    'X_kwDOJEBj4toAKGFmXXFlYmY0MTJjNmQwYjg2NWEzNxXxXXXxMzdmZGI0NmMwZmFiNjM',
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
      url: 'https://api.example.com/trees/347a2c4dc61cb708a1067675fd6dbc1f0ea74608',
    },
    url: 'https://api.example.com/commits/afeaebf412c6d0b865a36cfdec37fdb46c0fab63',
    comment_count: 0,
    verification: {
      verified: false,
      reason: 'unsigned',
      signature: null,
      payload: null,
    },
  },
  url: 'https://api.example.com/afeaebf412c6d0b865a36cfdec37fdb46c0fab63',
  html_url: 'https://example.com/afeaebf412c6d0b865a36cfdec37fdb46c0fab63',
  comments_url:
    'https://api.example.com/afeaebf412c6d0b865a36cfdec37fdb46c0fab63/comments',
  author: {
    login: 'TechUser',
    id: 1234567891,
    node_id: 'XXXXXXXlcjMwMTIxNzU5',
    avatar_url: 'https://example.com/u/xxxxxxxxx?v=4',
    gravatar_id: '',
    url: 'https://api.example.com/users/TechUser',
    html_url: 'https://example.com/TechUser',
    followers_url: 'https://api.example.com/users/TechUser/followers',
    following_url:
      'https://api.example.com/users/TechUser/following{/other_user}',
    gists_url: 'https://api.example.com/users/TechUser/gists{/gist_id}',
    starred_url:
      'https://api.example.com/users/TechUser/starred{/owner}{/repo}',
    subscriptions_url: 'https://api.example.com/users/TechUser/subscriptions',
    organizations_url: 'https://api.example.com/users/TechUser/orgs',
    repos_url: 'https://api.example.com/users/TechUser/repos',
    events_url: 'https://api.example.com/users/TechUser/events{/privacy}',
    received_events_url:
      'https://api.example.com/users/TechUser/received_events',
    type: 'User',
    site_admin: false,
  },
  committer: {
    login: 'TechUser',
    id: 1234567891,
    node_id: 'XXXXXXXlcjMwMTIxNzU5',
    avatar_url: 'https://example.com/u/xxxxxxxxx?v=4',
    gravatar_id: '',
    url: 'https://api.example.com/users/TechUser',
    html_url: 'https://example.com/TechUser',
    followers_url: 'https://api.example.com/users/TechUser/followers',
    following_url:
      'https://api.example.com/users/TechUser/following{/other_user}',
    gists_url: 'https://api.example.com/users/TechUser/gists{/gist_id}',
    starred_url:
      'https://api.example.com/users/TechUser/starred{/owner}{/repo}',
    subscriptions_url: 'https://api.example.com/users/TechUser/subscriptions',
    organizations_url: 'https://api.example.com/users/TechUser/orgs',
    repos_url: 'https://api.example.com/users/TechUser/repos',
    events_url: 'https://api.example.com/users/TechUser/events{/privacy}',
    received_events_url:
      'https://api.example.com/users/TechUser/received_events',
    type: 'User',
    site_admin: false,
  },
  parents: [
    {
      sha: '097079eba1e7749d6d86d324fa530f8e89e55595',
      url: 'https://api.example.com/097079eba1e7749d6d86d324fa530f8e89e55595',
      html_url: 'https://example.com/097079eba1e7749d6d86d324fa530f8e89e55595',
    },
  ],
  stats: {
    total: 472,
    additions: 472,
    deletions: 0,
  },
  files: [
    {
      sha: 'b6702e99ebb354a6500eb19e24e29a134abdd80c',
      filename: 'apps/git-fetcher/package.json',
      status: 'added',
      additions: 42,
      deletions: 0,
      changes: 42,
      blob_url:
        'https://example.com/blob/afeaebf412c6d0b865a36cfdec37fdb46c0fab63/apps%2Fgit-fetcher%2Fpackage.json',
      raw_url:
        'https://example.com/raw/afeaebf412c6d0b865a36cfdec37fdb46c0fab63/apps%2Fgit-fetcher%2Fpackage.json',
      contents_url:
        'https://api.example.com/repos/contents/apps%2Fgit-fetcher%2Fpackage.json?ref=afeaebf412c6d0b865a36cfdec37fdb46c0fab63',
      patch:
        '@@ -0,0 +1,42 @@\n+{\n+  "name": "@B-S-F/git-fetcher",\n+  "version": "0.1.1",\n+  "description": "",\n+  "type": "module",\n+  "main": "dist/index.js",\n+  "scripts": {\n+    "login-artifactory": "npm login --registry https://example.com/api/npm  --scope @top99",\n+    "prepare": "npm run build",\n+    "build": "tsup",\n+    "dev": "nodemon --watch \\"src/**\\" --exec npm run start",\n+    "start": "npm run build && node dist/index.js",\n+    "lint": "eslint \'**/*.ts\'",\n+    "setup": "npm install && npm run build",\n+    "format": "prettier src --write"\n+  },\n+  "keywords": [],\n+  "author": "",\n+  "files": [\n+    "dist"\n+  ],\n+  "license": "",\n+  "dependencies": {\n+    "fs-extra": "^10.1.0",\n+    "node-fetch": "^3.2.10",\n+    "process": "^0.11.10",\n+    "tsup": "^6.5.0"\n+  },\n+  "devDependencies": {\n+    "@B-S-F/eslint-config": "*",\n+    "@B-S-F/typescript-config": "*",\n+    "@types/node": "*",\n+    "@typescript-eslint/eslint-plugin": "*",\n+    "@typescript-eslint/parser": "*",\n+    "eslint": "*",\n+    "eslint-config-prettier": "*",\n+    "typescript": "*"\n+  },\n+  "bin": {\n+    "git-fetcher": "dist/index.js"\n+  }\n+}',
    },
    {
      sha: '4438322ba0497ba85a170bd065ed9050a63ff830',
      filename: 'apps/git-fetcher/src/fetchers/git-fetcher.ts',
      status: 'added',
      additions: 99,
      deletions: 0,
      changes: 99,
      blob_url:
        'https://example.com/blob/afeaebf412c6d0b865a36cfdec37fdb46c0fab63/apps%2Fgit-fetcher%2Fsrc%2Ffetchers%2Fgit-fetcher.ts',
      raw_url:
        'https://example.com/raw/afeaebf412c6d0b865a36cfdec37fdb46c0fab63/apps%2Fgit-fetcher%2Fsrc%2Ffetchers%2Fgit-fetcher.ts',
      contents_url:
        'https://api.example.com/repos/contents/apps%2Fgit-fetcher%2Fsrc%2Ffetchers%2Fgit-fetcher.ts?ref=afeaebf412c6d0b865a36cfdec37fdb46c0fab63',
      patch:
        "@@ -0,0 +1,99 @@\n+import { GitServerConfig } from '../model/git-server-config'\n+import { ConfigFileData } from '../model/config-file-data'\n+import { handleResponseStatus } from '../utils/handle-response-status.js'\n+\n+export class GitFetcher {\n+  constructor(public env: GitServerConfig, public config: ConfigFileData) {}\n+\n+  public pullRequestValidInputs = [\n+    'pull-request',\n+    'pull-requests',\n+    'pr',\n+    'prs',\n+    'pullrequest',\n+    'pullrequests',\n+    'pull',\n+    'pulls',\n+  ]\n+\n+  public validateResourceName(resource: string) {\n+    if (this.env.gitServerType == 'bitbucket') {\n+      if (this.pullRequestValidInputs.includes(resource.toLocaleLowerCase())) {\n+        return 'pull-requests'\n+      } else {\n+        throw new Error(`${resource} resource name not valid`)\n+      }\n+    } else if (this.env.gitServerType == 'github') {\n+      if (this.pullRequestValidInputs.includes(resource.toLocaleLowerCase())) {\n+        return 'pulls'\n+      } else {\n+        throw new Error(`${resource} resource name not valid`)\n+      }\n+    } else {\n+      throw new Error(`${this.env.gitServerType} server type not supported`)\n+    }\n+  }\n+\n+  public async getOptions() {\n+    if (this.env.gitServerAuthMethod.toLocaleLowerCase() == 'basic') {\n+      const options = {\n+        method: 'GET',\n+        auth: {\n+          username: this.env.gitServerUsername,\n+          password: this.env.gitServerPassword,\n+        },\n+        headers: {\n+          Accept: 'application/vnd.github+json',\n+        },\n+      }\n+      return options\n+    } else if (this.env.gitServerAuthMethod.toLocaleLowerCase() == 'token') {\n+      const options = {\n+        method: 'GET',\n+        headers: {\n+          Accept: 'application/json',\n+          Authorization: `Bearer ${this.env.gitServerApiToken}`,\n+        },\n+      }\n+      return options\n+    } else {\n+      throw new Error('No valid auth method provided')\n+    }\n+  }\n+\n+  public async buildUrl(resource: string) {\n+    const resourceName = this.validateResourceName(resource)\n+    if (this.env.gitServerType == 'bitbucket') {\n+      const endpoint = `${this.env.gitServerApiUrl.replace(\n+        //*$/,\n+        ''\n+      )}/projects/${this.config.data.org}/repos/${\n+        this.config.data.repo\n+      }/${resourceName}?state=ALL`\n+      return endpoint\n+    } else if (this.env.gitServerType == 'github') {\n+      const endpoint = `${this.env.gitServerApiUrl.replace(//*$/, '')}/repos/${\n+        this.config.data.org\n+      }/${this.config.data.repo}/${resourceName}?state=all&per_page=100`\n+      return endpoint\n+    } else {\n+      throw new Error(`${this.env.gitServerType} server type not supported`)\n+    }\n+  }\n+\n+  public async runQuery() {\n+    const url = await this.buildUrl(this.config.data.resource)\n+    const options = await this.getOptions()\n+    try {\n+      const response = await fetch(url, options)\n+      if (response.status != 200) {\n+        handleResponseStatus(response.status)\n+      }\n+      return response.json()\n+    } catch (error: any) {\n+      throw new Error(\n+        `Got the following error when running Git fetcher: ${error.message}`\n+      )\n+    }\n+  }\n+}",
    },
    {
      sha: 'b89b727221e34f5bed6c5f2e81ee9eb0c8f48a74',
      filename: 'apps/git-fetcher/src/index.ts',
      status: 'added',
      additions: 13,
      deletions: 0,
      changes: 13,
      blob_url:
        'https://example.com/blob/afeaebf412c6d0b865a36cfdec37fdb46c0fab63/apps%2Fgit-fetcher%2Fsrc%2Findex.ts',
      raw_url:
        'https://example.com/raw/afeaebf412c6d0b865a36cfdec37fdb46c0fab63/apps%2Fgit-fetcher%2Fsrc%2Findex.ts',
      contents_url:
        'https://api.example.com/repos/contents/apps%2Fgit-fetcher%2Fsrc%2Findex.ts?ref=afeaebf412c6d0b865a36cfdec37fdb46c0fab63',
      patch:
        "@@ -0,0 +1,13 @@\n+#!/usr/bin/env node\n+\n+import { run } from './run.js'\n+try {\n+  await run()\n+} catch (error: any) {\n+  console.log(\n+    JSON.stringify({\n+      comment: `Could not fetch data: ${error.message}`,\n+    })\n+  )\n+  process.exit(1)\n+}",
    },
  ],
}

export const githubEndCommitResponse: GithubSingleCommitResponse = {
  sha: '8036cf75f4b7365efea76cbd716ef12d352d7d29',
  node_id: 'C_kwDOJEBj4toAKDgxXXXxxXXXXXXXxXXXxxxXXxxXxxNmVmMTJkMzUyZDdkMjk',
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
      url: 'https://api.example.com/trees/9450ecc9597185ad82f9c9b61df5337f5ad4a286',
    },
    url: 'https://api.example.com/commits/8036cf75f4b7365efea76cbd716ef12d352d7d29',
    comment_count: 0,
    verification: {
      verified: false,
      reason: 'unsigned',
      signature: null,
      payload: null,
    },
  },
  url: 'https://api.example.com/8036cf75f4b7365efea76cbd716ef12d352d7d29',
  html_url: 'https://example.com/8036cf75f4b7365efea76cbd716ef12d352d7d29',
  comments_url:
    'https://api.example.com/8036cf75f4b7365efea76cbd716ef12d352d7d29/comments',
  author: {
    login: 'TechUser',
    id: 112345678,
    node_id: 'XXXXXXXlcjMwMTIxNzU5',
    avatar_url: 'https://example.com/u/40821471?v=4',
    gravatar_id: '',
    url: 'https://api.example.com/users/TechUser',
    html_url: 'https://example.com/TechUser',
    followers_url: 'https://api.example.com/users/TechUser/followers',
    following_url:
      'https://api.example.com/users/TechUser/following{/other_user}',
    gists_url: 'https://api.example.com/users/TechUser/gists{/gist_id}',
    starred_url:
      'https://api.example.com/users/TechUser/starred{/owner}{/repo}',
    subscriptions_url: 'https://api.example.com/users/TechUser/subscriptions',
    organizations_url: 'https://api.example.com/users/TechUser/orgs',
    repos_url: 'https://api.example.com/users/TechUser/repos',
    events_url: 'https://api.example.com/users/TechUser/events{/privacy}',
    received_events_url:
      'https://api.example.com/users/TechUser/received_events',
    type: 'User',
    site_admin: false,
  },
  committer: {
    login: 'TechUser',
    id: 112345678,
    node_id: 'XXXXXXXlcjMwMTIxNzU5',
    avatar_url: 'https://example.com/u/40821471?v=4',
    gravatar_id: '',
    url: 'https://api.example.com/users/TechUser',
    html_url: 'https://example.com/TechUser',
    followers_url: 'https://api.example.com/users/TechUser/followers',
    following_url:
      'https://api.example.com/users/TechUser/following{/other_user}',
    gists_url: 'https://api.example.com/users/TechUser/gists{/gist_id}',
    starred_url:
      'https://api.example.com/users/TechUser/starred{/owner}{/repo}',
    subscriptions_url: 'https://api.example.com/users/TechUser/subscriptions',
    organizations_url: 'https://api.example.com/users/TechUser/orgs',
    repos_url: 'https://api.example.com/users/TechUser/repos',
    events_url: 'https://api.example.com/users/TechUser/events{/privacy}',
    received_events_url:
      'https://api.example.com/users/TechUser/received_events',
    type: 'User',
    site_admin: false,
  },
  parents: [
    {
      sha: 'dc7e626d6da5b0b4911a1b11f0d5dcf6009f827f',
      url: 'https://api.example.com/dc7e626d6da5b0b4911a1b11f0d5dcf6009f827f',
      html_url: 'https://example.com/dc7e626d6da5b0b4911a1b11f0d5dcf6009f827f',
    },
  ],
  stats: {
    total: 210,
    additions: 208,
    deletions: 2,
  },
  files: [
    {
      sha: 'c274acc18f53be6f0e14e8f787a28e8ba20af89d',
      filename:
        'apps/git-fetcher/src/fetchers/git-fetcher-github-commits-and-diff.ts',
      status: 'added',
      additions: 114,
      deletions: 0,
      changes: 114,
      blob_url:
        'https://example.com/blob/8036cf75f4b7365efea76cbd716ef12d352d7d29/apps%2Fgit-fetcher%2Fsrc%2Ffetchers%2Fgit-fetcher-github-commits-and-diff.ts',
      raw_url:
        'https://example.com/raw/8036cf75f4b7365efea76cbd716ef12d352d7d29/apps%2Fgit-fetcher%2Fsrc%2Ffetchers%2Fgit-fetcher-github-commits-and-diff.ts',
      contents_url:
        'https://api.example.com/repos/contents/apps%2Fgit-fetcher%2Fsrc%2Ffetchers%2Fgit-fetcher-github-commits-and-diff.ts?ref=8036cf75f4b7365efea76cbd716ef12d352d7d29',
      patch:
        "@@ -0,0 +1,114 @@\n+import { CommitsMetadataAndDiff } from '../model/bitbucket-commits-metadata-and-diff'\n+import { ConfigFileData } from '../model/config-file-data'\n+import { GitServerConfig } from '../model/git-server-config'\n+import { GitFetcher } from './git-fetcher'\n+import { getRequestOptions } from './utils/get-request-options.js'\n+\n+export class GitFetcherGithubCommitsAndDiff\n+  implements GitFetcher<CommitsMetadataAndDiff>\n+{\n+  constructor(\n+    private readonly gitServerConfig: GitServerConfig,\n+    private readonly config: ConfigFileData\n+  ) {}\n+\n+  private incrementSecondsAndReturnIsoFormat = (startDate: string) => {\n+    const newDate = new Date(\n+      new Date(startDate).setUTCSeconds(new Date(startDate).getUTCSeconds() + 1)\n+    )\n+    return (\n+      newDate.getUTCFullYear() +\n+      '-' +\n+      (newDate.getUTCMonth() + 1) +\n+      '-' +\n+      newDate.getUTCDate() +\n+      'T' +\n+      newDate.getUTCHours() +\n+      ':' +\n+      newDate.getUTCMinutes() +\n+      ':' +\n+      newDate.getUTCSeconds() +\n+      'Z'\n+    )\n+  }\n+\n+  public async fetchResource(): Promise<CommitsMetadataAndDiff> {\n+    const requestOptions: RequestInit = await getRequestOptions(\n+      this.gitServerConfig\n+    )\n+    let result: CommitsMetadataAndDiff = {\n+      commitsMetadata: [],\n+      diff: {},\n+    }\n+    try {\n+      const serverName = this.gitServerConfig.gitServerApiUrl\n+      const projectKey = this.config.data.org\n+      const repositorySlug = this.config.data.repo\n+      const filePath = this.config.data.filePath\n+      const startHash = this.config.data.filter?.startHash\n+      let endHash = this.config.data.filter?.endHash\n+      if (!filePath) {\n+        throw new Error(\n+          `Please define the 'filePath' parameter in the config and try again`\n+        )\n+      }\n+      if (!startHash) {\n+        throw new Error(\n+          `Please define the 'filter.startHash' parameter in the config and try again`\n+        )\n+      }\n+      let startDate\n+      let startCommitUrl = `${serverName}/repos/${projectKey}/${repositorySlug}/commits/${startHash}`\n+      let response: Response = await fetch(startCommitUrl, requestOptions)\n+      let responseBody = await response.json()\n+      startDate = responseBody.commit.committer.date\n+      //function below is required in order to have consistency between the '/compare' and '/commits' API calls\n+      startDate = this.incrementSecondsAndReturnIsoFormat(startDate)\n+\n+      if (!endHash) {\n+        endHash = 'master'\n+      }\n+      let endDate\n+      let endCommitUrl = `${serverName}/repos/${projectKey}/${repositorySlug}/commits/${endHash}`\n+      response = await fetch(endCommitUrl, requestOptions)\n+      responseBody = await response.json()\n+      endDate = responseBody.commit.committer.date\n+\n+      let diffUrl = `${serverName}/repos/${projectKey}/${repositorySlug}/compare/${startHash}...${endHash}`\n+      response = await fetch(diffUrl, requestOptions)\n+      responseBody = await response.json()\n+      for (const file of responseBody.files) {\n+        if (file.filename === filePath) {\n+          const linesAdded = file.patch.match(/\\n\\+[\\S\\s]*?(?=\\n)/g)\n+          result.diff['linesAdded'] = linesAdded\n+\n+          const linesRemoved = file.patch.match(/\\n\\-[\\S\\s]*?(?=\\n)/g)\n+          result.diff['linesRemoved'] = linesRemoved\n+          break\n+        }\n+      }\n+\n+      let currentPage: number | null = 1\n+      while (currentPage != null) {\n+        let commitsUrl = `${serverName}/repos/${projectKey}/${repositorySlug}/commits?path=${filePath}&until=${endDate}&page=${currentPage}&per_page=100`\n+        if (startDate) {\n+          commitsUrl = commitsUrl + `&since=${startDate}`\n+        }\n+        let response: Response = await fetch(commitsUrl, requestOptions)\n+        let responseBody = await response.json()\n+\n+        if (responseBody.length > 0) {\n+          for (const data of responseBody) {\n+            result.commitsMetadata.push(data.commit)\n+          }\n+          currentPage = currentPage + 1\n+        } else {\n+          currentPage = null\n+        }\n+      }\n+    } catch (error: any) {\n+      throw new Error(`github commits and diffs: ${error.message}`)\n+    }\n+    return result\n+  }\n+}",
    },
    {
      sha: '73491746fc3d4c675726060b73df7dd8ccf72309',
      filename: 'apps/git-fetcher/src/fetchers/git-fetcher.ts',
      status: 'modified',
      additions: 1,
      deletions: 1,
      changes: 2,
      blob_url:
        'https://example.com/blob/8036cf75f4b7365efea76cbd716ef12d352d7d29/apps%2Fgit-fetcher%2Fsrc%2Ffetchers%2Fgit-fetcher.ts',
      raw_url:
        'https://example.com/raw/8036cf75f4b7365efea76cbd716ef12d352d7d29/apps%2Fgit-fetcher%2Fsrc%2Ffetchers%2Fgit-fetcher.ts',
      contents_url:
        'https://api.example.com/repos/contents/apps%2Fgit-fetcher%2Fsrc%2Ffetchers%2Fgit-fetcher.ts?ref=8036cf75f4b7365efea76cbd716ef12d352d7d29',
      patch:
        '@@ -1,3 +1,3 @@\n export interface GitFetcher<T> {\n-  fetchResource(): Promise<T[]>\n+  fetchResource(): Promise<T[] | T>\n }',
    },
    {
      sha: '9f8469934f0143966ac39eadd0b7c88b51dc5e6e',
      filename:
        'apps/git-fetcher/src/model/bitbucket-commits-metadata-and-diff.ts',
      status: 'added',
      additions: 4,
      deletions: 0,
      changes: 4,
      blob_url:
        'https://example.com/blob/8036cf75f4b7365efea76cbd716ef12d352d7d29/apps%2Fgit-fetcher%2Fsrc%2Fmodel%2Fbitbucket-commits-metadata-and-diff.ts',
      raw_url:
        'https://example.com/raw/8036cf75f4b7365efea76cbd716ef12d352d7d29/apps%2Fgit-fetcher%2Fsrc%2Fmodel%2Fbitbucket-commits-metadata-and-diff.ts',
      contents_url:
        'https://api.example.com/repos/contents/apps%2Fgit-fetcher%2Fsrc%2Fmodel%2Fbitbucket-commits-metadata-and-diff.ts?ref=8036cf75f4b7365efea76cbd716ef12d352d7d29',
      patch:
        '@@ -0,0 +1,4 @@\n+export type CommitsMetadataAndDiff = {\n+  commitsMetadata: any\n+  diff: any\n+}',
    },
  ],
}

export const githubDiffResponse: GithubDiffResponse = {
  url: 'https://api.example.com/repos/compare/afeaebf412c6d0b865a36cfdec37fdb46c0fab63...8036cf75f4b7365efea76cbd716ef12d352d7d29',
  html_url:
    'https://example.com/compare/afeaebf412c6d0b865a36cfdec37fdb46c0fab63...8036cf75f4b7365efea76cbd716ef12d352d7d29',
  permalink_url:
    'https://example.com/compare/B-S-F:afeaebf...B-S-F:8036cf7',
  diff_url:
    'https://example.com/compare/afeaebf412c6d0b865a36cfdec37fdb46c0fab63...8036cf75f4b7365efea76cbd716ef12d352d7d29.diff',
  patch_url:
    'https://example.com/compare/afeaebf412c6d0b865a36cfdec37fdb46c0fab63...8036cf75f4b7365efea76cbd716ef12d352d7d29.patch',
  base_commit: {
    sha: 'afeaebf412c6d0b865a36cfdec37fdb46c0fab63',
    node_id: 'C_kwDOJEBj4toAKDgxXXXxxXXXXXXXxXXXxxxXXxxXxxNmVmMTJkMzUyZDdkMjk',
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
        url: 'https://api.example.com/trees/347a2c4dc61cb708a1067675fd6dbc1f0ea74608',
      },
      url: 'https://api.example.com/commits/afeaebf412c6d0b865a36cfdec37fdb46c0fab63',
      comment_count: 0,
      verification: {
        verified: false,
        reason: 'unsigned',
        signature: null,
        payload: null,
      },
    },
    url: 'https://api.example.com/afeaebf412c6d0b865a36cfdec37fdb46c0fab63',
    html_url: 'https://example.com/afeaebf412c6d0b865a36cfdec37fdb46c0fab63',
    comments_url:
      'https://api.example.com/afeaebf412c6d0b865a36cfdec37fdb46c0fab63/comments',
    author: {
      login: 'TechUser',
      id: 1234567891,
      node_id: 'XXXXXXXlcjMwMTIxNzU5',
      avatar_url: 'https://example.com/u/xxxxxxxxx?v=4',
      gravatar_id: '',
      url: 'https://api.example.com/users/TechUser',
      html_url: 'https://example.com/TechUser',
      followers_url: 'https://api.example.com/users/TechUser/followers',
      following_url:
        'https://api.example.com/users/TechUser/following{/other_user}',
      gists_url: 'https://api.example.com/users/TechUser/gists{/gist_id}',
      starred_url:
        'https://api.example.com/users/TechUser/starred{/owner}{/repo}',
      subscriptions_url: 'https://api.example.com/users/TechUser/subscriptions',
      organizations_url: 'https://api.example.com/users/TechUser/orgs',
      repos_url: 'https://api.example.com/users/TechUser/repos',
      events_url: 'https://api.example.com/users/TechUser/events{/privacy}',
      received_events_url:
        'https://api.example.com/users/TechUser/received_events',
      type: 'User',
      site_admin: false,
    },
    committer: {
      login: 'TechUser',
      id: 1234567891,
      node_id: 'XXXXXXXlcjMwMTIxNzU5',
      avatar_url: 'https://example.com/u/xxxxxxxxx?v=4',
      gravatar_id: '',
      url: 'https://api.example.com/users/TechUser',
      html_url: 'https://example.com/TechUser',
      followers_url: 'https://api.example.com/users/TechUser/followers',
      following_url:
        'https://api.example.com/users/TechUser/following{/other_user}',
      gists_url: 'https://api.example.com/users/TechUser/gists{/gist_id}',
      starred_url:
        'https://api.example.com/users/TechUser/starred{/owner}{/repo}',
      subscriptions_url: 'https://api.example.com/users/TechUser/subscriptions',
      organizations_url: 'https://api.example.com/users/TechUser/orgs',
      repos_url: 'https://api.example.com/users/TechUser/repos',
      events_url: 'https://api.example.com/users/TechUser/events{/privacy}',
      received_events_url:
        'https://api.example.com/users/TechUser/received_events',
      type: 'User',
      site_admin: false,
    },
    parents: [
      {
        sha: '097079eba1e7749d6d86d324fa530f8e89e55595',
        url: 'https://api.example.com/097079eba1e7749d6d86d324fa530f8e89e55595',
        html_url:
          'https://example.com/097079eba1e7749d6d86d324fa530f8e89e55595',
      },
    ],
  },
  merge_base_commit: {
    sha: 'afeaebf412c6d0b865a36cfdec37fdb46c0fab63',
    node_id: 'C_kwDOJEBj4toAKDgxXXXxxXXXXXXXxXXXxxxXXxxXxxNmVmMTJkMzUyZDdkMjk',
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
        url: 'https://api.example.com/trees/347a2c4dc61cb708a1067675fd6dbc1f0ea74608',
      },
      url: 'https://api.example.com/commits/afeaebf412c6d0b865a36cfdec37fdb46c0fab63',
      comment_count: 0,
      verification: {
        verified: false,
        reason: 'unsigned',
        signature: null,
        payload: null,
      },
    },
    url: 'https://api.example.com/afeaebf412c6d0b865a36cfdec37fdb46c0fab63',
    html_url: 'https://example.com/afeaebf412c6d0b865a36cfdec37fdb46c0fab63',
    comments_url:
      'https://api.example.com/afeaebf412c6d0b865a36cfdec37fdb46c0fab63/comments',
    author: {
      login: 'TechUser',
      id: 1234567891,
      node_id: 'XXXXXXXlcjMwMTIxNzU5',
      avatar_url: 'https://example.com/u/xxxxxxxxx?v=4',
      gravatar_id: '',
      url: 'https://api.example.com/users/TechUser',
      html_url: 'https://example.com/TechUser',
      followers_url: 'https://api.example.com/users/TechUser/followers',
      following_url:
        'https://api.example.com/users/TechUser/following{/other_user}',
      gists_url: 'https://api.example.com/users/TechUser/gists{/gist_id}',
      starred_url:
        'https://api.example.com/users/TechUser/starred{/owner}{/repo}',
      subscriptions_url: 'https://api.example.com/users/TechUser/subscriptions',
      organizations_url: 'https://api.example.com/users/TechUser/orgs',
      repos_url: 'https://api.example.com/users/TechUser/repos',
      events_url: 'https://api.example.com/users/TechUser/events{/privacy}',
      received_events_url:
        'https://api.example.com/users/TechUser/received_events',
      type: 'User',
      site_admin: false,
    },
    committer: {
      login: 'TechUser',
      id: 1234567891,
      node_id: 'XXXXXXXlcjMwMTIxNzU5',
      avatar_url: 'https://example.com/u/xxxxxxxxx?v=4',
      gravatar_id: '',
      url: 'https://api.example.com/users/TechUser',
      html_url: 'https://example.com/TechUser',
      followers_url: 'https://api.example.com/users/TechUser/followers',
      following_url:
        'https://api.example.com/users/TechUser/following{/other_user}',
      gists_url: 'https://api.example.com/users/TechUser/gists{/gist_id}',
      starred_url:
        'https://api.example.com/users/TechUser/starred{/owner}{/repo}',
      subscriptions_url: 'https://api.example.com/users/TechUser/subscriptions',
      organizations_url: 'https://api.example.com/users/TechUser/orgs',
      repos_url: 'https://api.example.com/users/TechUser/repos',
      events_url: 'https://api.example.com/users/TechUser/events{/privacy}',
      received_events_url:
        'https://api.example.com/users/TechUser/received_events',
      type: 'User',
      site_admin: false,
    },
    parents: [
      {
        sha: '097079eba1e7749d6d86d324fa530f8e89e55595',
        url: 'https://api.example.com/097079eba1e7749d6d86d324fa530f8e89e55595',
        html_url:
          'https://example.com/097079eba1e7749d6d86d324fa530f8e89e55595',
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
      node_id:
        'C_kwDOJEBj4toAKDgxXXXxxXXXXXXXxXXXxxxXXxxXxxNmVmMTJkMzUyZDdkMjk',
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
          url: 'https://api.example.com/trees/84152e149262f4883b1c724d9c9bb8e4e5d23fad',
        },
        url: 'https://api.example.com/commits/fbf45173f2c1fbf4f6f2439abba88946a2cc8360',
        comment_count: 0,
        verification: {
          verified: false,
          reason: 'unsigned',
          signature: null,
          payload: null,
        },
      },
      url: 'https://api.example.com/fbf45173f2c1fbf4f6f2439abba88946a2cc8360',
      html_url: 'https://example.com/fbf45173f2c1fbf4f6f2439abba88946a2cc8360',
      comments_url:
        'https://api.example.com/fbf45173f2c1fbf4f6f2439abba88946a2cc8360/comments',
      author: {
        login: 'TechUser',
        id: 1234567891,
        node_id: 'XXXXXXXlcjMwMTIxNzU5',
        avatar_url: 'https://example.com/u/xxxxxxxxx?v=4',
        gravatar_id: '',
        url: 'https://api.example.com/users/TechUser',
        html_url: 'https://example.com/TechUser',
        followers_url: 'https://api.example.com/users/TechUser/followers',
        following_url:
          'https://api.example.com/users/TechUser/following{/other_user}',
        gists_url: 'https://api.example.com/users/TechUser/gists{/gist_id}',
        starred_url:
          'https://api.example.com/users/TechUser/starred{/owner}{/repo}',
        subscriptions_url:
          'https://api.example.com/users/TechUser/subscriptions',
        organizations_url: 'https://api.example.com/users/TechUser/orgs',
        repos_url: 'https://api.example.com/users/TechUser/repos',
        events_url: 'https://api.example.com/users/TechUser/events{/privacy}',
        received_events_url:
          'https://api.example.com/users/TechUser/received_events',
        type: 'User',
        site_admin: false,
      },
      committer: {
        login: 'TechUser',
        id: 1234567891,
        node_id: 'XXXXXXXlcjMwMTIxNzU5',
        avatar_url: 'https://example.com/u/xxxxxxxxx?v=4',
        gravatar_id: '',
        url: 'https://api.example.com/users/TechUser',
        html_url: 'https://example.com/TechUser',
        followers_url: 'https://api.example.com/users/TechUser/followers',
        following_url:
          'https://api.example.com/users/TechUser/following{/other_user}',
        gists_url: 'https://api.example.com/users/TechUser/gists{/gist_id}',
        starred_url:
          'https://api.example.com/users/TechUser/starred{/owner}{/repo}',
        subscriptions_url:
          'https://api.example.com/users/TechUser/subscriptions',
        organizations_url: 'https://api.example.com/users/TechUser/orgs',
        repos_url: 'https://api.example.com/users/TechUser/repos',
        events_url: 'https://api.example.com/users/TechUser/events{/privacy}',
        received_events_url:
          'https://api.example.com/users/TechUser/received_events',
        type: 'User',
        site_admin: false,
      },
      parents: [
        {
          sha: 'afeaebf412c6d0b865a36cfdec37fdb46c0fab63',
          url: 'https://api.example.com/afeaebf412c6d0b865a36cfdec37fdb46c0fab63',
          html_url:
            'https://example.com/afeaebf412c6d0b865a36cfdec37fdb46c0fab63',
        },
      ],
    },
  ],
  files: [
    {
      sha: 'ab49e18dfe46bfe03d9fa77837cff8ccd175de53',
      filename: 'apps/git-fetcher/src/fetchers/git-fetcher-github-prs.ts',
      status: 'added',
      additions: 106,
      deletions: 0,
      changes: 106,
      blob_url:
        'https://example.com/blob/8036cf75f4b7365efea76cbd716ef12d352d7d29/apps%2Fgit-fetcher%2Fsrc%2Ffetchers%2Fgit-fetcher-github-prs.ts',
      raw_url:
        'https://example.com/raw/8036cf75f4b7365efea76cbd716ef12d352d7d29/apps%2Fgit-fetcher%2Fsrc%2Ffetchers%2Fgit-fetcher-github-prs.ts',
      contents_url:
        'https://api.example.com/repos/contents/apps%2Fgit-fetcher%2Fsrc%2Ffetchers%2Fgit-fetcher-github-prs.ts?ref=8036cf75f4b7365efea76cbd716ef12d352d7d29',
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
        'https://example.com/blob/8036cf75f4b7365efea76cbd716ef12d352d7d29/apps%2Fgit-fetcher%2Fsrc%2Ffetchers%2Fgit-fetcher.ts',
      raw_url:
        'https://example.com/raw/8036cf75f4b7365efea76cbd716ef12d352d7d29/apps%2Fgit-fetcher%2Fsrc%2Ffetchers%2Fgit-fetcher.ts',
      contents_url:
        'https://api.example.com/repos/contents/apps%2Fgit-fetcher%2Fsrc%2Ffetchers%2Fgit-fetcher.ts?ref=8036cf75f4b7365efea76cbd716ef12d352d7d29',
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
        'https://example.com/blob/8036cf75f4b7365efea76cbd716ef12d352d7d29/apps%2Fgit-fetcher%2Fsrc%2Ffetchers%2Findex.ts',
      raw_url:
        'https://example.com/raw/8036cf75f4b7365efea76cbd716ef12d352d7d29/apps%2Fgit-fetcher%2Fsrc%2Ffetchers%2Findex.ts',
      contents_url:
        'https://api.example.com/repos/contents/apps%2Fgit-fetcher%2Fsrc%2Ffetchers%2Findex.ts?ref=8036cf75f4b7365efea76cbd716ef12d352d7d29',
      patch:
        "@@ -0,0 +1,2 @@\n+export * from './git-fetcher.js'\n+export * from './generate-git-fetcher.js'",
    },
  ],
}

export const githubMultipleCommitsResponse: GithubMultipleCommitsResponse[] = [
  {
    sha: '8036cf75f4b7365efea76cbd716ef12d352d7d29',
    node_id: 'C_kwDOJEBj4toAKDgxxxXXXxxZZZzzZZXXzzmVmMTJkMzUyZDdkMjk',
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
        url: 'https://api.example.com/trees/9450ecc9597185ad82f9c9b61df5337f5ad4a286',
      },
      url: 'https://api.example.com/commits/8036cf75f4b7365efea76cbd716ef12d352d7d29',
      comment_count: 0,
      verification: {
        verified: false,
        reason: 'unsigned',
        signature: null,
        payload: null,
      },
    },
    url: 'https://api.example.com/8036cf75f4b7365efea76cbd716ef12d352d7d29',
    html_url: 'https://example.com/8036cf75f4b7365efea76cbd716ef12d352d7d29',
    comments_url:
      'https://api.example.com/8036cf75f4b7365efea76cbd716ef12d352d7d29/comments',
    author: {
      login: 'TechUser',
      id: 112345678,
      node_id: 'XXXXXXXlcjMwMTIxNzU5',
      avatar_url: 'https://example.com/u/40821471?v=4',
      gravatar_id: '',
      url: 'https://api.example.com/users/TechUser',
      html_url: 'https://example.com/TechUser',
      followers_url: 'https://api.example.com/users/TechUser/followers',
      following_url:
        'https://api.example.com/users/TechUser/following{/other_user}',
      gists_url: 'https://api.example.com/users/TechUser/gists{/gist_id}',
      starred_url:
        'https://api.example.com/users/TechUser/starred{/owner}{/repo}',
      subscriptions_url: 'https://api.example.com/users/TechUser/subscriptions',
      organizations_url: 'https://api.example.com/users/TechUser/orgs',
      repos_url: 'https://api.example.com/users/TechUser/repos',
      events_url: 'https://api.example.com/users/TechUser/events{/privacy}',
      received_events_url:
        'https://api.example.com/users/TechUser/received_events',
      type: 'User',
      site_admin: false,
    },
    committer: {
      login: 'TechUser',
      id: 112345678,
      node_id: 'XXXXXXXlcjMwMTIxNzU5',
      avatar_url: 'https://example.com/u/40821471?v=4',
      gravatar_id: '',
      url: 'https://api.example.com/users/TechUser',
      html_url: 'https://example.com/TechUser',
      followers_url: 'https://api.example.com/users/TechUser/followers',
      following_url:
        'https://api.example.com/users/TechUser/following{/other_user}',
      gists_url: 'https://api.example.com/users/TechUser/gists{/gist_id}',
      starred_url:
        'https://api.example.com/users/TechUser/starred{/owner}{/repo}',
      subscriptions_url: 'https://api.example.com/users/TechUser/subscriptions',
      organizations_url: 'https://api.example.com/users/TechUser/orgs',
      repos_url: 'https://api.example.com/users/TechUser/repos',
      events_url: 'https://api.example.com/users/TechUser/events{/privacy}',
      received_events_url:
        'https://api.example.com/users/TechUser/received_events',
      type: 'User',
      site_admin: false,
    },
    parents: [
      {
        sha: 'dc7e626d6da5b0b4911a1b11f0d5dcf6009f827f',
        url: 'https://api.example.com/dc7e626d6da5b0b4911a1b11f0d5dcf6009f827f',
        html_url:
          'https://example.com/dc7e626d6da5b0b4911a1b11f0d5dcf6009f827f',
      },
    ],
  },
  {
    sha: '8cf0dafa2bfcc3104aa0d69ae7cf9ff55ceab8cd',
    node_id:
      'C_kwDOJEBj4toAKDhjZjBkYWZhxxxXXxxXXXXXXXxZZZzzzzxXXZXxZmY1NWNlYWI4Y2Q',
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
        url: 'https://api.example.com/trees/1a2539623b501741ccec196ad673071570a35dbe',
      },
      url: 'https://api.example.com/commits/8cf0dafa2bfcc3104aa0d69ae7cf9ff55ceab8cd',
      comment_count: 0,
      verification: {
        verified: false,
        reason: 'unsigned',
        signature: null,
        payload: null,
      },
    },
    url: 'https://api.example.com/8cf0dafa2bfcc3104aa0d69ae7cf9ff55ceab8cd',
    html_url: 'https://example.com/8cf0dafa2bfcc3104aa0d69ae7cf9ff55ceab8cd',
    comments_url:
      'https://api.example.com/8cf0dafa2bfcc3104aa0d69ae7cf9ff55ceab8cd/comments',
    author: {
      login: 'TechUser',
      id: 1234567482,
      node_id: 'U_kgxXXxxXXxxxg',
      avatar_url: 'https://example.com/u/1234567482?v=4',
      gravatar_id: '',
      url: 'https://api.example.com/users/TechUser',
      html_url: 'https://example.com/TechUser',
      followers_url: 'https://api.example.com/users/TechUser/followers',
      following_url:
        'https://api.example.com/users/TechUser/following{/other_user}',
      gists_url: 'https://api.example.com/users/TechUser/gists{/gist_id}',
      starred_url:
        'https://api.example.com/users/TechUser/starred{/owner}{/repo}',
      subscriptions_url: 'https://api.example.com/users/TechUser/subscriptions',
      organizations_url: 'https://api.example.com/users/TechUser/orgs',
      repos_url: 'https://api.example.com/users/TechUser/repos',
      events_url: 'https://api.example.com/users/TechUser/events{/privacy}',
      received_events_url:
        'https://api.example.com/users/TechUser/received_events',
      type: 'User',
      site_admin: false,
    },
    committer: {
      login: 'TechUser',
      id: 1234567482,
      node_id: 'U_kgxXXxxXXxxxg',
      avatar_url: 'https://example.com/u/1234567482?v=4',
      gravatar_id: '',
      url: 'https://api.example.com/users/TechUser',
      html_url: 'https://example.com/TechUser',
      followers_url: 'https://api.example.com/users/TechUser/followers',
      following_url:
        'https://api.example.com/users/TechUser/following{/other_user}',
      gists_url: 'https://api.example.com/users/TechUser/gists{/gist_id}',
      starred_url:
        'https://api.example.com/users/TechUser/starred{/owner}{/repo}',
      subscriptions_url: 'https://api.example.com/users/TechUser/subscriptions',
      organizations_url: 'https://api.example.com/users/TechUser/orgs',
      repos_url: 'https://api.example.com/users/TechUser/repos',
      events_url: 'https://api.example.com/users/TechUser/events{/privacy}',
      received_events_url:
        'https://api.example.com/users/TechUser/received_events',
      type: 'User',
      site_admin: false,
    },
    parents: [
      {
        sha: '2f6d4472f7114cbacb6770fdabaa21b9e8e100aa',
        url: 'https://api.example.com/2f6d4472f7114cbacb6770fdabaa21b9e8e100aa',
        html_url:
          'https://example.com/2f6d4472f7114cbacb6770fdabaa21b9e8e100aa',
      },
    ],
  },
  {
    sha: 'd6a73ae06e781fe510090dc58f33cc7bcf8c9c11',
    node_id: 'C_kwDOJEBj4toAKGQ2YTcxxxxxxxxxxxxxxxxxxxxxxxxdiY2Y4YzljMTE',
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
        url: 'https://api.example.com/trees/d7950bd787096772a6cabde0b24fd4c68ca3aa77',
      },
      url: 'https://api.example.com/commits/d6a73ae06e781fe510090dc58f33cc7bcf8c9c11',
      comment_count: 0,
      verification: {
        verified: false,
        reason: 'unsigned',
        signature: null,
        payload: null,
      },
    },
    url: 'https://api.example.com/d6a73ae06e781fe510090dc58f33cc7bcf8c9c11',
    html_url: 'https://example.com/d6a73ae06e781fe510090dc58f33cc7bcf8c9c11',
    comments_url:
      'https://api.example.com/d6a73ae06e781fe510090dc58f33cc7bcf8c9c11/comments',
    author: {
      login: 'TechUser',
      id: 1234567482,
      node_id: 'U_kgxXXxxXXxxxg',
      avatar_url: 'https://example.com/u/1234567482?v=4',
      gravatar_id: '',
      url: 'https://api.example.com/users/TechUser',
      html_url: 'https://example.com/TechUser',
      followers_url: 'https://api.example.com/users/TechUser/followers',
      following_url:
        'https://api.example.com/users/TechUser/following{/other_user}',
      gists_url: 'https://api.example.com/users/TechUser/gists{/gist_id}',
      starred_url:
        'https://api.example.com/users/TechUser/starred{/owner}{/repo}',
      subscriptions_url: 'https://api.example.com/users/TechUser/subscriptions',
      organizations_url: 'https://api.example.com/users/TechUser/orgs',
      repos_url: 'https://api.example.com/users/TechUser/repos',
      events_url: 'https://api.example.com/users/TechUser/events{/privacy}',
      received_events_url:
        'https://api.example.com/users/TechUser/received_events',
      type: 'User',
      site_admin: false,
    },
    committer: {
      login: 'TechUser',
      id: 1234567482,
      node_id: 'U_kgxXXxxXXxxxg',
      avatar_url: 'https://example.com/u/1234567482?v=4',
      gravatar_id: '',
      url: 'https://api.example.com/users/TechUser',
      html_url: 'https://example.com/TechUser',
      followers_url: 'https://api.example.com/users/TechUser/followers',
      following_url:
        'https://api.example.com/users/TechUser/following{/other_user}',
      gists_url: 'https://api.example.com/users/TechUser/gists{/gist_id}',
      starred_url:
        'https://api.example.com/users/TechUser/starred{/owner}{/repo}',
      subscriptions_url: 'https://api.example.com/users/TechUser/subscriptions',
      organizations_url: 'https://api.example.com/users/TechUser/orgs',
      repos_url: 'https://api.example.com/users/TechUser/repos',
      events_url: 'https://api.example.com/users/TechUser/events{/privacy}',
      received_events_url:
        'https://api.example.com/users/TechUser/received_events',
      type: 'User',
      site_admin: false,
    },
    parents: [
      {
        sha: '8d59a30e6fbbd75320695c46c7221bab9fe07424',
        url: 'https://api.example.com/8d59a30e6fbbd75320695c46c7221bab9fe07424',
        html_url:
          'https://example.com/8d59a30e6fbbd75320695c46c7221bab9fe07424',
      },
    ],
  },
  {
    sha: '70c52ff0011d60ded7d438463ad44945306ddc7f',
    node_id:
      'C_kwDOJEBj4toAKDcwYzUyZmYwMDExZDYwZGVkN2Q0Mzg0NjNhZDQ0OTQ1MzA2ZGRjN2Y',
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
        url: 'https://api.example.com/trees/2f147a29812c08781b5be7eb01d7267fb1b157e7',
      },
      url: 'https://api.example.com/commits/70c52ff0011d60ded7d438463ad44945306ddc7f',
      comment_count: 0,
      verification: {
        verified: false,
        reason: 'unsigned',
        signature: null,
        payload: null,
      },
    },
    url: 'https://api.example.com/70c52ff0011d60ded7d438463ad44945306ddc7f',
    html_url: 'https://example.com/70c52ff0011d60ded7d438463ad44945306ddc7f',
    comments_url:
      'https://api.example.com/70c52ff0011d60ded7d438463ad44945306ddc7f/comments',
    author: {
      login: 'TechUser',
      id: 1234567482,
      node_id: 'U_kgxXXxxXXxxxg',
      avatar_url: 'https://example.com/u/1234567482?v=4',
      gravatar_id: '',
      url: 'https://api.example.com/users/TechUser',
      html_url: 'https://example.com/TechUser',
      followers_url: 'https://api.example.com/users/TechUser/followers',
      following_url:
        'https://api.example.com/users/TechUser/following{/other_user}',
      gists_url: 'https://api.example.com/users/TechUser/gists{/gist_id}',
      starred_url:
        'https://api.example.com/users/TechUser/starred{/owner}{/repo}',
      subscriptions_url: 'https://api.example.com/users/TechUser/subscriptions',
      organizations_url: 'https://api.example.com/users/TechUser/orgs',
      repos_url: 'https://api.example.com/users/TechUser/repos',
      events_url: 'https://api.example.com/users/TechUser/events{/privacy}',
      received_events_url:
        'https://api.example.com/users/TechUser/received_events',
      type: 'User',
      site_admin: false,
    },
    committer: {
      login: 'TechUser',
      id: 564897364,
      node_id: 'U_kgxxxxxQg',
      avatar_url: 'https://example.com/u/564897364?v=4',
      gravatar_id: '',
      url: 'https://api.example.com/users/TechUser',
      html_url: 'https://example.com/TechUser',
      followers_url: 'https://api.example.com/users/TechUser/followers',
      following_url:
        'https://api.example.com/users/TechUser/following{/other_user}',
      gists_url: 'https://api.example.com/users/TechUser/gists{/gist_id}',
      starred_url:
        'https://api.example.com/users/TechUser/starred{/owner}{/repo}',
      subscriptions_url: 'https://api.example.com/users/TechUser/subscriptions',
      organizations_url: 'https://api.example.com/users/TechUser/orgs',
      repos_url: 'https://api.example.com/users/TechUser/repos',
      events_url: 'https://api.example.com/users/TechUser/events{/privacy}',
      received_events_url:
        'https://api.example.com/users/TechUser/received_events',
      type: 'User',
      site_admin: false,
    },
    parents: [
      {
        sha: 'cc0a150e8c5585f6212abab78ceaf8bc2b4f94c1',
        url: 'https://api.example.com/cc0a150e8c5585f6212abab78ceaf8bc2b4f94c1',
        html_url:
          'https://example.com/cc0a150e8c5585f6212abab78ceaf8bc2b4f94c1',
      },
    ],
  },
  {
    sha: '92aa336413904e67151b6625dbaeb3fbe01ef132',
    node_id:
      'C_kwDOJEBj4toAKDkyYWEzMzY0MTM5MDRlNjcxNTFiNjYyNWRiYWViM2ZiZTAxZWYxMzI',
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
        url: 'https://api.example.com/trees/97fe2161887bd14518dea8fbf308d5165b03987d',
      },
      url: 'https://api.example.com/commits/92aa336413904e67151b6625dbaeb3fbe01ef132',
      comment_count: 0,
      verification: {
        verified: false,
        reason: 'unsigned',
        signature: null,
        payload: null,
      },
    },
    url: 'https://api.example.com/92aa336413904e67151b6625dbaeb3fbe01ef132',
    html_url: 'https://example.com/92aa336413904e67151b6625dbaeb3fbe01ef132',
    comments_url:
      'https://api.example.com/92aa336413904e67151b6625dbaeb3fbe01ef132/comments',
    author: {
      login: 'TechUser',
      id: 1234567482,
      node_id: 'U_kgxXXxxXXxxxg',
      avatar_url: 'https://example.com/u/1234567482?v=4',
      gravatar_id: '',
      url: 'https://api.example.com/users/TechUser',
      html_url: 'https://example.com/TechUser',
      followers_url: 'https://api.example.com/users/TechUser/followers',
      following_url:
        'https://api.example.com/users/TechUser/following{/other_user}',
      gists_url: 'https://api.example.com/users/TechUser/gists{/gist_id}',
      starred_url:
        'https://api.example.com/users/TechUser/starred{/owner}{/repo}',
      subscriptions_url: 'https://api.example.com/users/TechUser/subscriptions',
      organizations_url: 'https://api.example.com/users/TechUser/orgs',
      repos_url: 'https://api.example.com/users/TechUser/repos',
      events_url: 'https://api.example.com/users/TechUser/events{/privacy}',
      received_events_url:
        'https://api.example.com/users/TechUser/received_events',
      type: 'User',
      site_admin: false,
    },
    committer: {
      login: 'TechUser',
      id: 1234567482,
      node_id: 'U_kgxXXxxXXxxxg',
      avatar_url: 'https://example.com/u/1234567482?v=4',
      gravatar_id: '',
      url: 'https://api.example.com/users/TechUser',
      html_url: 'https://example.com/TechUser',
      followers_url: 'https://api.example.com/users/TechUser/followers',
      following_url:
        'https://api.example.com/users/TechUser/following{/other_user}',
      gists_url: 'https://api.example.com/users/TechUser/gists{/gist_id}',
      starred_url:
        'https://api.example.com/users/TechUser/starred{/owner}{/repo}',
      subscriptions_url: 'https://api.example.com/users/TechUser/subscriptions',
      organizations_url: 'https://api.example.com/users/TechUser/orgs',
      repos_url: 'https://api.example.com/users/TechUser/repos',
      events_url: 'https://api.example.com/users/TechUser/events{/privacy}',
      received_events_url:
        'https://api.example.com/users/TechUser/received_events',
      type: 'User',
      site_admin: false,
    },
    parents: [
      {
        sha: '1f0f928abc84ba2d51b0da0cb40f4388d4a60f27',
        url: 'https://api.example.com/1f0f928abc84ba2d51b0da0cb40f4388d4a60f27',
        html_url:
          'https://example.com/1f0f928abc84ba2d51b0da0cb40f4388d4a60f27',
      },
    ],
  },
]

export const githubMultipleCommitsResponsePage1: GithubMultipleCommitsResponse[] =
  [
    {
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
          url: 'https://api.example.com/trees/9450ecc9597185ad82f9c9b61df5337f5ad4a286',
        },
        url: 'https://api.example.com/commits/8036cf75f4b7365efea76cbd716ef12d352d7d29',
        comment_count: 0,
        verification: {
          verified: false,
          reason: 'unsigned',
          signature: null,
          payload: null,
        },
      },
      url: 'https://api.example.com/8036cf75f4b7365efea76cbd716ef12d352d7d29',
      html_url: 'https://example.com/8036cf75f4b7365efea76cbd716ef12d352d7d29',
      comments_url:
        'https://api.example.com/8036cf75f4b7365efea76cbd716ef12d352d7d29/comments',
      author: {
        login: 'TechUser',
        id: 112345678,
        node_id: 'XXXXXXXlcjMwMTIxNzU5',
        avatar_url: 'https://example.com/u/40821471?v=4',
        gravatar_id: '',
        url: 'https://api.example.com/users/TechUser',
        html_url: 'https://example.com/TechUser',
        followers_url: 'https://api.example.com/users/TechUser/followers',
        following_url:
          'https://api.example.com/users/TechUser/following{/other_user}',
        gists_url: 'https://api.example.com/users/TechUser/gists{/gist_id}',
        starred_url:
          'https://api.example.com/users/TechUser/starred{/owner}{/repo}',
        subscriptions_url:
          'https://api.example.com/users/TechUser/subscriptions',
        organizations_url: 'https://api.example.com/users/TechUser/orgs',
        repos_url: 'https://api.example.com/users/TechUser/repos',
        events_url: 'https://api.example.com/users/TechUser/events{/privacy}',
        received_events_url:
          'https://api.example.com/users/TechUser/received_events',
        type: 'User',
        site_admin: false,
      },
      committer: {
        login: 'TechUser',
        id: 112345678,
        node_id: 'XXXXXXXlcjMwMTIxNzU5',
        avatar_url: 'https://example.com/u/40821471?v=4',
        gravatar_id: '',
        url: 'https://api.example.com/users/TechUser',
        html_url: 'https://example.com/TechUser',
        followers_url: 'https://api.example.com/users/TechUser/followers',
        following_url:
          'https://api.example.com/users/TechUser/following{/other_user}',
        gists_url: 'https://api.example.com/users/TechUser/gists{/gist_id}',
        starred_url:
          'https://api.example.com/users/TechUser/starred{/owner}{/repo}',
        subscriptions_url:
          'https://api.example.com/users/TechUser/subscriptions',
        organizations_url: 'https://api.example.com/users/TechUser/orgs',
        repos_url: 'https://api.example.com/users/TechUser/repos',
        events_url: 'https://api.example.com/users/TechUser/events{/privacy}',
        received_events_url:
          'https://api.example.com/users/TechUser/received_events',
        type: 'User',
        site_admin: false,
      },
      parents: [
        {
          sha: 'dc7e626d6da5b0b4911a1b11f0d5dcf6009f827f',
          url: 'https://api.example.com/dc7e626d6da5b0b4911a1b11f0d5dcf6009f827f',
          html_url:
            'https://example.com/dc7e626d6da5b0b4911a1b11f0d5dcf6009f827f',
        },
      ],
    },
    {
      sha: '8cf0dafa2bfcc3104aa0d69ae7cf9ff55ceab8cd',
      node_id:
        'C_kwDOJEBj4toAKDhjZjBkYWZhMmJmY2MzMTA0YWEwZDY5YWU3Y2Y5ZmY1NWNlYWI4Y2Q',
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
          url: 'https://api.example.com/trees/1a2539623b501741ccec196ad673071570a35dbe',
        },
        url: 'https://api.example.com/commits/8cf0dafa2bfcc3104aa0d69ae7cf9ff55ceab8cd',
        comment_count: 0,
        verification: {
          verified: false,
          reason: 'unsigned',
          signature: null,
          payload: null,
        },
      },
      url: 'https://api.example.com/8cf0dafa2bfcc3104aa0d69ae7cf9ff55ceab8cd',
      html_url: 'https://example.com/8cf0dafa2bfcc3104aa0d69ae7cf9ff55ceab8cd',
      comments_url:
        'https://api.example.com/8cf0dafa2bfcc3104aa0d69ae7cf9ff55ceab8cd/comments',
      author: {
        login: 'TechUser',
        id: 564897364,
        node_id: 'U_kgxxxxxQg',
        avatar_url: 'https://example.com/u/564897364?v=4',
        gravatar_id: '',
        url: 'https://api.example.com/users/TechUser',
        html_url: 'https://example.com/TechUser',
        followers_url: 'https://api.example.com/users/TechUser/followers',
        following_url:
          'https://api.example.com/users/TechUser/following{/other_user}',
        gists_url: 'https://api.example.com/users/TechUser/gists{/gist_id}',
        starred_url:
          'https://api.example.com/users/TechUser/starred{/owner}{/repo}',
        subscriptions_url:
          'https://api.example.com/users/TechUser/subscriptions',
        organizations_url: 'https://api.example.com/users/TechUser/orgs',
        repos_url: 'https://api.example.com/users/TechUser/repos',
        events_url: 'https://api.example.com/users/TechUser/events{/privacy}',
        received_events_url:
          'https://api.example.com/users/TechUser/received_events',
        type: 'User',
        site_admin: false,
      },
      committer: {
        login: 'TechUser',
        id: 564897364,
        node_id: 'U_kgxxxxxQg',
        avatar_url: 'https://example.com/u/564897364?v=4',
        gravatar_id: '',
        url: 'https://api.example.com/users/TechUser',
        html_url: 'https://example.com/TechUser',
        followers_url: 'https://api.example.com/users/TechUser/followers',
        following_url:
          'https://api.example.com/users/TechUser/following{/other_user}',
        gists_url: 'https://api.example.com/users/TechUser/gists{/gist_id}',
        starred_url:
          'https://api.example.com/users/TechUser/starred{/owner}{/repo}',
        subscriptions_url:
          'https://api.example.com/users/TechUser/subscriptions',
        organizations_url: 'https://api.example.com/users/TechUser/orgs',
        repos_url: 'https://api.example.com/users/TechUser/repos',
        events_url: 'https://api.example.com/users/TechUser/events{/privacy}',
        received_events_url:
          'https://api.example.com/users/TechUser/received_events',
        type: 'User',
        site_admin: false,
      },
      parents: [
        {
          sha: '2f6d4472f7114cbacb6770fdabaa21b9e8e100aa',
          url: 'https://api.example.com/2f6d4472f7114cbacb6770fdabaa21b9e8e100aa',
          html_url:
            'https://example.com/2f6d4472f7114cbacb6770fdabaa21b9e8e100aa',
        },
      ],
    },
  ]

export const githubMultipleCommitsResponsePage2: GithubMultipleCommitsResponse[] =
  [
    {
      sha: 'd6a73ae06e781fe510090dc58f33cc7bcf8c9c11',
      node_id: 'C_kwDOJEBj4toAKGQ2YTczYWUwNmU3ODxxxxxxxxXXXXXxxxxxxxx4YzljMTE',
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
          url: 'https://api.example.com/trees/d7950bd787096772a6cabde0b24fd4c68ca3aa77',
        },
        url: 'https://api.example.com/commits/d6a73ae06e781fe510090dc58f33cc7bcf8c9c11',
        comment_count: 0,
        verification: {
          verified: false,
          reason: 'unsigned',
          signature: null,
          payload: null,
        },
      },
      url: 'https://api.example.com/d6a73ae06e781fe510090dc58f33cc7bcf8c9c11',
      html_url: 'https://example.com/d6a73ae06e781fe510090dc58f33cc7bcf8c9c11',
      comments_url:
        'https://api.example.com/d6a73ae06e781fe510090dc58f33cc7bcf8c9c11/comments',
      author: {
        login: 'TechUser',
        id: 1234567482,
        node_id: 'U_kgDOxxxxxxx',
        avatar_url: 'https://example.com/u/1234567482?v=4',
        gravatar_id: '',
        url: 'https://api.example.com/users/TechUser',
        html_url: 'https://example.com/TechUser',
        followers_url: 'https://api.example.com/users/TechUser/followers',
        following_url:
          'https://api.example.com/users/TechUser/following{/other_user}',
        gists_url: 'https://api.example.com/users/TechUser/gists{/gist_id}',
        starred_url:
          'https://api.example.com/users/TechUser/starred{/owner}{/repo}',
        subscriptions_url:
          'https://api.example.com/users/TechUser/subscriptions',
        organizations_url: 'https://api.example.com/users/TechUser/orgs',
        repos_url: 'https://api.example.com/users/TechUser/repos',
        events_url: 'https://api.example.com/users/TechUser/events{/privacy}',
        received_events_url:
          'https://api.example.com/users/TechUser/received_events',
        type: 'User',
        site_admin: false,
      },
      committer: {
        login: 'TechUser',
        id: 1234567482,
        node_id: 'U_kgDOxxxxxxx',
        avatar_url: 'https://example.com/u/1234567482?v=4',
        gravatar_id: '',
        url: 'https://api.example.com/users/TechUser',
        html_url: 'https://example.com/TechUser',
        followers_url: 'https://api.example.com/users/TechUser/followers',
        following_url:
          'https://api.example.com/users/TechUser/following{/other_user}',
        gists_url: 'https://api.example.com/users/TechUser/gists{/gist_id}',
        starred_url:
          'https://api.example.com/users/TechUser/starred{/owner}{/repo}',
        subscriptions_url:
          'https://api.example.com/users/TechUser/subscriptions',
        organizations_url: 'https://api.example.com/users/TechUser/orgs',
        repos_url: 'https://api.example.com/users/TechUser/repos',
        events_url: 'https://api.example.com/users/TechUser/events{/privacy}',
        received_events_url:
          'https://api.example.com/users/TechUser/received_events',
        type: 'User',
        site_admin: false,
      },
      parents: [
        {
          sha: '8d59a30e6fbbd75320695c46c7221bab9fe07424',
          url: 'https://api.example.com/8d59a30e6fbbd75320695c46c7221bab9fe07424',
          html_url:
            'https://example.com/8d59a30e6fbbd75320695c46c7221bab9fe07424',
        },
      ],
    },
    {
      sha: '70c52ff0011d60ded7d438463ad44945306ddc7f',
      node_id:
        'C_kwDOJEBj4toAKDxxxXXXxXxxXXXXxxXxXXxxxXXXXxxXXXXxxxTQ1MzA2ZGRjN2Y',
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
          url: 'https://api.example.com/trees/2f147a29812c08781b5be7eb01d7267fb1b157e7',
        },
        url: 'https://api.example.com/commits/70c52ff0011d60ded7d438463ad44945306ddc7f',
        comment_count: 0,
        verification: {
          verified: false,
          reason: 'unsigned',
          signature: null,
          payload: null,
        },
      },
      url: 'https://api.example.com/70c52ff0011d60ded7d438463ad44945306ddc7f',
      html_url: 'https://example.com/70c52ff0011d60ded7d438463ad44945306ddc7f',
      comments_url:
        'https://api.example.com/70c52ff0011d60ded7d438463ad44945306ddc7f/comments',
      author: {
        login: 'TechUser',
        id: 1234567482,
        node_id: 'U_kgxXXxxXXxxxg',
        avatar_url: 'https://example.com/u/1234567482?v=4',
        gravatar_id: '',
        url: 'https://api.example.com/users/TechUser',
        html_url: 'https://example.com/TechUser',
        followers_url: 'https://api.example.com/users/TechUser/followers',
        following_url:
          'https://api.example.com/users/TechUser/following{/other_user}',
        gists_url: 'https://api.example.com/users/TechUser/gists{/gist_id}',
        starred_url:
          'https://api.example.com/users/TechUser/starred{/owner}{/repo}',
        subscriptions_url:
          'https://api.example.com/users/TechUser/subscriptions',
        organizations_url: 'https://api.example.com/users/TechUser/orgs',
        repos_url: 'https://api.example.com/users/TechUser/repos',
        events_url: 'https://api.example.com/users/TechUser/events{/privacy}',
        received_events_url:
          'https://api.example.com/users/TechUser/received_events',
        type: 'User',
        site_admin: false,
      },
      committer: {
        login: 'TechUser',
        id: 564897364,
        node_id: 'U_kgxxxxxQg',
        avatar_url: 'https://example.com/u/564897364?v=4',
        gravatar_id: '',
        url: 'https://api.example.com/users/TechUser',
        html_url: 'https://example.com/TechUser',
        followers_url: 'https://api.example.com/users/TechUser/followers',
        following_url:
          'https://api.example.com/users/TechUser/following{/other_user}',
        gists_url: 'https://api.example.com/users/TechUser/gists{/gist_id}',
        starred_url:
          'https://api.example.com/users/TechUser/starred{/owner}{/repo}',
        subscriptions_url:
          'https://api.example.com/users/TechUser/subscriptions',
        organizations_url: 'https://api.example.com/users/TechUser/orgs',
        repos_url: 'https://api.example.com/users/TechUser/repos',
        events_url: 'https://api.example.com/users/TechUser/events{/privacy}',
        received_events_url:
          'https://api.example.com/users/TechUser/received_events',
        type: 'User',
        site_admin: false,
      },
      parents: [
        {
          sha: 'cc0a150e8c5585f6212abab78ceaf8bc2b4f94c1',
          url: 'https://api.example.com/cc0a150e8c5585f6212abab78ceaf8bc2b4f94c1',
          html_url:
            'https://example.com/cc0a150e8c5585f6212abab78ceaf8bc2b4f94c1',
        },
      ],
    },
  ]

export const githubMultipleCommitsResponsePage3: GithubMultipleCommitsResponse[] =
  [
    {
      sha: '92aa336413904e67151b6625dbaeb3fbe01ef132',
      node_id:
        'C_kwDOJEBj4toAKDkyYWEzMzY0MTM5MDRlNjcxNTFiNjYyNWRiYWViM2ZiZTAxZWYxMzI',
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
          url: 'https://api.example.com/trees/97fe2161887bd14518dea8fbf308d5165b03987d',
        },
        url: 'https://api.example.com/commits/92aa336413904e67151b6625dbaeb3fbe01ef132',
        comment_count: 0,
        verification: {
          verified: false,
          reason: 'unsigned',
          signature: null,
          payload: null,
        },
      },
      url: 'https://api.example.com/92aa336413904e67151b6625dbaeb3fbe01ef132',
      html_url: 'https://example.com/92aa336413904e67151b6625dbaeb3fbe01ef132',
      comments_url:
        'https://api.example.com/92aa336413904e67151b6625dbaeb3fbe01ef132/comments',
      author: {
        login: 'TechUser',
        id: 1234567482,
        node_id: 'U_kgxXXxxXXxxxg',
        avatar_url: 'https://example.com/u/1234567482?v=4',
        gravatar_id: '',
        url: 'https://api.example.com/users/TechUser',
        html_url: 'https://example.com/TechUser',
        followers_url: 'https://api.example.com/users/TechUser/followers',
        following_url:
          'https://api.example.com/users/TechUser/following{/other_user}',
        gists_url: 'https://api.example.com/users/TechUser/gists{/gist_id}',
        starred_url:
          'https://api.example.com/users/TechUser/starred{/owner}{/repo}',
        subscriptions_url:
          'https://api.example.com/users/TechUser/subscriptions',
        organizations_url: 'https://api.example.com/users/TechUser/orgs',
        repos_url: 'https://api.example.com/users/TechUser/repos',
        events_url: 'https://api.example.com/users/TechUser/events{/privacy}',
        received_events_url:
          'https://api.example.com/users/TechUser/received_events',
        type: 'User',
        site_admin: false,
      },
      committer: {
        login: 'TechUser',
        id: 1234567482,
        node_id: 'U_kgxXXxxXXxxxg',
        avatar_url: 'https://example.com/u/1234567482?v=4',
        gravatar_id: '',
        url: 'https://api.example.com/users/TechUser',
        html_url: 'https://example.com/TechUser',
        followers_url: 'https://api.example.com/users/TechUser/followers',
        following_url:
          'https://api.example.com/users/TechUser/following{/other_user}',
        gists_url: 'https://api.example.com/users/TechUser/gists{/gist_id}',
        starred_url:
          'https://api.example.com/users/TechUser/starred{/owner}{/repo}',
        subscriptions_url:
          'https://api.example.com/users/TechUser/subscriptions',
        organizations_url: 'https://api.example.com/users/TechUser/orgs',
        repos_url: 'https://api.example.com/users/TechUser/repos',
        events_url: 'https://api.example.com/users/TechUser/events{/privacy}',
        received_events_url:
          'https://api.example.com/users/TechUser/received_events',
        type: 'User',
        site_admin: false,
      },
      parents: [
        {
          sha: '1f0f928abc84ba2d51b0da0cb40f4388d4a60f27',
          url: 'https://api.example.com/1f0f928abc84ba2d51b0da0cb40f4388d4a60f27',
          html_url:
            'https://example.com/1f0f928abc84ba2d51b0da0cb40f4388d4a60f27',
        },
      ],
    },
  ]

export const githubCommitsEmptyResponse: GithubMultipleCommitsResponse[] = []

export const githubNoDiffResponse: GithubDiffResponse = {
  url: '',
  html_url: '',
  permalink_url: '',
  diff_url: '',
  patch_url: '',
  base_commit: '',
  merge_base_commit: {},
  status: '',
  ahead_by: 0,
  behind_by: 0,
  total_commits: 0,
  commits: [],
  files: [],
}
