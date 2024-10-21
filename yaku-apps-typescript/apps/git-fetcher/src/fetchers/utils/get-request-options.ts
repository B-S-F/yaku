import { GitServerConfig } from '../../model/git-server-config'

export async function getRequestOptions(
  gitServerConfig: GitServerConfig
): Promise<RequestInit> {
  const options: RequestInit = {
    method: 'GET',
  }

  if (gitServerConfig.gitServerAuthMethod === 'basic') {
    const encodedCredentials: string = Buffer.from(
      `${gitServerConfig.gitServerUsername}:${gitServerConfig.gitServerPassword}`
    ).toString('base64')

    options.headers = {
      accept: 'application/vnd.github+json',
      authorization: `Basic ${encodedCredentials}`,
    }
  } else if (gitServerConfig.gitServerAuthMethod === 'token') {
    options.headers = {
      accept: 'application/json',
      authorization: `Bearer ${gitServerConfig.gitServerApiToken}`,
    }
  }
  return options
}
