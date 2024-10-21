export const supportedGitServerTypes = ['github', 'bitbucket'] as const
export type SupportedGitServerType = (typeof supportedGitServerTypes)[number]

export const supportedAuthMethods = ['token', 'basic'] as const
export type SupportedAuthMethod = (typeof supportedAuthMethods)[number]

interface GitServerConfigBase {
  gitServerType: SupportedGitServerType
  gitServerApiUrl: string
  gitFetcherConfigFilePath: string
  gitFetcherOutputFilePath: string
}

export interface GitServerConfigAuthBasic extends GitServerConfigBase {
  gitServerAuthMethod: 'basic'
  gitServerUsername: string
  gitServerPassword: string
}

export interface GitServerConfigAuthToken extends GitServerConfigBase {
  gitServerAuthMethod: 'token'
  gitServerApiToken: string
}

export type GitServerConfig =
  | GitServerConfigAuthBasic
  | GitServerConfigAuthToken
