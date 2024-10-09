import { createHash, randomBytes } from 'crypto'
import { BaseClient, custom, Issuer } from 'openid-client'
import open from 'open'
import { ProxyAgent } from 'proxy-agent'
import { config } from './config.js'
import { Environment } from './commands/environment.js'
import { fetch, EnvHttpProxyAgent } from 'undici'

const agent = new ProxyAgent()
custom.setHttpOptionsDefaults({
  agent: agent,
})

export type OAuth2Config = {
  responseType: string
  clientId: string
  scope: string
  loginTimeout: number
  apiUrl: string
}

export type OAuthLoginResponse = {
  accessToken: string
  refreshToken: string
  expiresAt?: number
}

export class OAuthClient {
  private client: BaseClient | undefined
  private cfg: OAuth2Config

  constructor(cfg: OAuth2Config) {
    this.cfg = cfg
  }

  async connect(): Promise<void> {
    let issuer

    /*
     * Newer service versions provide a pointer to the OIDC well-known URL
     * Try whether the service we are connecting to, supports that feature.
     */

    try {
      const wellKnownUrl = await this.getWellKnownConfigUrl(this.cfg.apiUrl)
      issuer = await Issuer.discover(`${wellKnownUrl}`)
    } catch (err) {
      throw new Error(
        `Failed to discover OAuth issuer from well-known config URL: ${err}`
      )
    }

    this.client = new issuer.Client({
      client_id: this.cfg.clientId,
      response_types: [this.cfg.responseType],
      token_endpoint_auth_method: 'none',
      id_token_signed_response_alg: 'RS256',
    })
  }
  async login(): Promise<OAuthLoginResponse> {
    if (!this.client) {
      throw new Error('Client not connected')
    }
    const verifier = generateCodeVerifier()
    const challenge = base64URLEncode(
      createHash('sha256').update(verifier).digest()
    )
    const handle = await this.client.deviceAuthorization(
      {
        scope: this.cfg.scope,
        code_challenge_method: 'S256',
        code_challenge: challenge,
      },
      { exchangeBody: { code_verifier: verifier } }
    )
    console.log(`Copy this code '${handle.user_code}'.`)
    console.log(
      `Then visit the following URL '${handle.verification_uri}' and enter the code to authorize the application.`
    )
    try {
      open(handle.verification_uri)
    } catch (err) {
      // ignore
    }
    const tokenSet = await handle.poll()
    if (!tokenSet.access_token || !tokenSet.refresh_token) {
      throw new Error('Failed to retrieve token')
    }
    return {
      accessToken: tokenSet.access_token!,
      refreshToken: tokenSet.refresh_token!,
      expiresAt: tokenSet.expires_at,
    }
  }
  async refresh(token: string): Promise<OAuthLoginResponse> {
    if (!this.client) {
      throw new Error('Client not connected')
    }
    const tokenSet = await this.client.refresh(token)
    if (!tokenSet.access_token || !tokenSet.refresh_token) {
      throw new Error('Failed to refresh token')
    }
    return {
      accessToken: tokenSet.access_token!,
      refreshToken: tokenSet.refresh_token!,
      expiresAt: tokenSet.expires_at,
    }
  }
  async getWellKnownConfigUrl(envUrl: string): Promise<string> {
    try {
      const keycloakUrl = `${envUrl}/service/authinfo`
      const response = await fetch(keycloakUrl, {
        method: 'GET',
        dispatcher: new EnvHttpProxyAgent(),
      })

      const res = (await response.json()) as any
      const url = res.wellKnownConfigUrl

      if (!url) {
        return Promise.reject()
      }

      return url
    } catch (err) {
      return Promise.reject()
    }
  }
}

const generateCodeVerifier = () => {
  return base64URLEncode(randomBytes(32))
}

const base64URLEncode = (buffer: Buffer) => {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export async function loginOAuth(
  envName: string,
  url: string,
  additionalScopes: string[] = []
): Promise<Environment> {
  const oAuth2Config: OAuth2Config = {
    ...config.oAuth2Config,
    scope: [config.oAuth2Config.scope, ...additionalScopes].join(' '),
    apiUrl: url,
  }

  const client = new OAuthClient(oAuth2Config)
  await client.connect()
  const loginResponse = await client.login()
  return {
    name: envName,
    url,
    accessToken: loginResponse.accessToken,
    refreshToken: loginResponse.refreshToken,
    expiresAt: loginResponse.expiresAt,
    current: true,
  }
}

export async function refreshOAuth(env: Environment): Promise<Environment> {
  const oAuth2Config: OAuth2Config = {
    ...config.oAuth2Config,
    apiUrl: env.url,
  }
  const oAuthClient = new OAuthClient(oAuth2Config)
  await oAuthClient.connect()
  let loginResponse: OAuthLoginResponse
  try {
    loginResponse = await oAuthClient.refresh(env.refreshToken!)
  } catch (error) {
    loginResponse = await oAuthClient.login()
  }
  return {
    ...env,
    accessToken: loginResponse.accessToken,
    refreshToken: loginResponse.refreshToken,
    expiresAt: loginResponse.expiresAt,
  }
}
