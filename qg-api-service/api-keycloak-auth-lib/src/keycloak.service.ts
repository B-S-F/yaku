import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  OnApplicationBootstrap,
} from '@nestjs/common'
import { InjectPinoLogger, Logger, PinoLogger } from 'nestjs-pino'
import { ProxyAgent } from 'proxy-agent'

/*
Node 18 does not support proxies with native fetch yet (https://github.com/nodejs/node/issues/42814)
In Node 20 it is possible by using the proxy-agent from undici
*/
import fetch, { RequestInit } from 'node-fetch'

export interface KeyCloakNamespace {
  id: number
  name: string
  roles: string[]
  users: string[]
  type: string
}
export interface KeyCloakUser {
  id: number
  kc_id: string
  kc_iss: string
  kc_sub: string
  username: string
  email: string
  displayName: string
  roles: string[]
  namespaces: KeyCloakNamespace[]
  interactive_login: boolean
}

interface InternalKeycloakUser {
  id: string
  username: string
  firstName: string
  lastName: string
  displayName: string
  email: string
}

export interface KeyCloakUserOfRole {
  kc_id: string
  username: string
  email: string
  displayName: string
  firstName: string
  lastName: string
}

class ServiceAccountToken {
  access_token: string
  expires_in: number
  issues_at: Date

  constructor(access_token: string, expires_in: number, issues_at: Date) {
    this.access_token = access_token
    this.expires_in = expires_in
    this.issues_at = issues_at
  }

  isExpired(): boolean {
    return (
      new Date().getTime() - this.issues_at.getTime() > this.expires_in * 1000
    )
  }
}

export class MissingUserError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MissingUserError'
  }
}

@Injectable()
export class KeyCloakConfig {
  constructor(
    readonly server: string,
    readonly realm: string,
    readonly enabled: string,
    readonly clientId: string,
    readonly clientSecret: string,
    readonly adminUrl: string,
    readonly wellKnownConfig: string,
    readonly useProxyAgent: boolean = false,
    readonly globalRoleClientId: string = 'GLOBAL',
    readonly namespaceAccessRoleName: string = 'ACCESS',
    readonly namespaceClientNamePrefix: string = 'NAMESPACE',
    readonly cliClientId: string = 'yaku-cli',
  ) {
    if (enabled != 'off' && enabled != 'on') {
      throw new InternalServerErrorException(
        `Keycloak enabled must be either "on" or "off", but is "${enabled}"`,
      )
    }
    if (
      enabled == 'on' &&
      (!server ||
        !realm ||
        !clientId ||
        !clientSecret ||
        !adminUrl ||
        !wellKnownConfig)
    ) {
      throw new InternalServerErrorException(
        `Keycloak is enabled, but server, realm, client id, client secret, admin URL or well-known config URL is not set`,
      )
    }
  }
}

@Injectable()
export class KeyCloakService implements OnApplicationBootstrap {
  @InjectPinoLogger(KeyCloakService.name)
  private readonly logger = new Logger(
    new PinoLogger({
      pinoHttp: {
        level: 'debug',
        serializers: {
          req: () => undefined,
          res: () => undefined,
        },
      },
    }),
    {},
  )
  private readonly proxyAgent = new ProxyAgent()
  private serviceAccountToken: ServiceAccountToken
  private OIDCEndpoints: {
    introspection_endpoint: string
    token_endpoint: string
  }

  constructor(@Inject(KeyCloakConfig) private readonly cfg: KeyCloakConfig) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      const endpoints = await this.getOpenIdConnectEndpoints(
        this.cfg.wellKnownConfig,
      )
      this.OIDCEndpoints = endpoints
    } catch {
      console.error(
        `Could not get OIDC endpoints. Using hard-coded endpoints instead.`,
      )
      this.OIDCEndpoints = {
        introspection_endpoint: `${this.cfg.server}/auth/realms/${this.cfg.realm}/protocol/openid-connect/token/introspect`,
        token_endpoint: `${this.cfg.server}/auth/realms/${this.cfg.realm}/protocol/openid-connect/token`,
      }
    }
  }

  /**
   * Asynchronously retrieves user information based on a provided token obtained from Keycloak.
   *
   * @param token {string} - The token obtained from Keycloak, which is used to fetch user information.
   *
   * @returns {Promise<KeyCloakUser>} - A Promise that resolves to an object containing user information.
   *
   * @throws {Error} If there are issues with fetching the user information, such as network errors, invalid token, or server unavailability.
   *
   * @example
   * try {
   *   const token = 'your-access-token'; // Replace with the actual token.
   *   const userInfo = await getKeyCloakUser(token);
   *   console.log('User information:', userInfo);
   * } catch (error) {
   *   // Handle the error when fetching user information.
   *   console.error(`Failed to retrieve user information: ${error.message}`);
   * }
   */
  async getKeyCloakUser(token: string): Promise<KeyCloakUser> {
    this.logger.debug({
      msg: 'Extracting user information from Keycloak token',
    })
    try {
      const obj = this.parseToken(token)
      const username = this.getUsername(obj, token)
      const email = this.getEmail(obj)
      const displayName = this.getDisplayName(obj)
      const roles = this.getRoles(obj)
      const namespaces = this.getNamespaces(obj)

      const userObject: KeyCloakUser = {
        id: 0,
        kc_id: `${obj.iss} ${obj.sub}`,
        kc_iss: `${obj.iss}`,
        kc_sub: `${obj.sub}`,
        username,
        email,
        displayName,
        roles,
        namespaces,
        interactive_login: true,
      }

      return userObject
    } catch (error) {
      this.logger.error({ msg: `Error in getKeyCloakUser: ${error.message}` })
      throw new Error(`Error in getKeyCloakUser: ${error.message}`)
    }
  }

  /**
   * Asynchronously retrieves user information based on the user id from cli client in Keycloak.
   *
   * @param userId {string} - The Keycloak specific user identifier, which is used to fetch user information.
   * @param additionalScopes {string[]} - Additional scopes to be used when querying the cli client
   *
   * @returns {Promise<KeyCloakUser>} - A Promise that resolves to an object containing user information.
   *
   * @throws {Error} If there are issues with fetching the user information, such as network errors, invalid token, or server unavailability.
   *
   * @example
   * try {
   *   const userId = 'ba1970de-3d34-49fd-bc31-c5c0c937ca61'; // Replace with the actual user id.
   *   const userInfo = await getKeyCloakUserFromCliClient(userId, []);
   *   console.log('User information:', userInfo);
   * } catch (error) {
   *   // Handle the error when fetching user information.
   *   console.error(`Failed to retrieve user information: ${error.message}`);
   * }
   */
  async getKeyCloakUserFromCliClient(
    userId: string,
    additionalScopes: string[],
  ): Promise<KeyCloakUser> {
    const client_uuid = await this.getClientIdFromName(this.cfg.cliClientId)
    const access_token = (await this.getAccessTokenFromClient(
      client_uuid,
      userId,
      additionalScopes,
    )) as any

    const username = this.getUsername(access_token, 'placeholder_value')
    const displayName = this.getDisplayName(access_token)
    const roles = this.getRoles(access_token)
    const namespaces = this.getNamespaces(access_token)

    const userObject: KeyCloakUser = {
      id: 0,
      kc_id: `${access_token.iss} ${access_token.sub}`,
      kc_iss: `${access_token.iss}`,
      kc_sub: `${access_token.sub}`,
      username,
      email: access_token.email,
      displayName,
      roles,
      namespaces,
      interactive_login: false,
    }

    return userObject
  }

  /**
   * Parses a token to extract and decode the payload part.
   *
   * @param token {string} - The token to be parsed and decoded.
   * @returns {any} - The decoded object from the token's payload.
   * @throws {Error} If the token cannot be parsed or decoded.
   */
  parseToken(token: string): any {
    const obj = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString(),
    )
    if (!obj) {
      throw new Error(`Unable to parse token: ${token}`)
    }
    return obj
  }

  /**
   * Retrieves the username from the token payload.
   *
   * @param obj {any} - The decoded token payload.
   * @param token {string} - The original token (for error message context).
   * @returns {string} - The username obtained from the token.
   * @throws {Error} If there is no preferred_username in the token payload.
   */
  getUsername(obj: any, token: string): string {
    const username = obj.preferred_username
    if (!username) {
      throw new Error(`No preferred_username in token: ${token}`)
    }
    return username
  }

  /**
   * Retrieves the email from the token payload.
   *
   * @param obj {any} - The decoded token payload.
   * @returns {string} - The email obtained from the token.
   * @throws {Error} If there is no email in the token payload.
   */
  getEmail(obj: any): string {
    const email = obj.email
    if (!email) {
      throw new Error(`No email in token`)
    }
    return email
  }

  /**
   * Retrieves the display name from the token payload.
   * If the display name is not present, a debug message is logged and the name attribute is used instead.
   *
   * @param obj {any} - The decoded token payload.
   * @returns {string} - The display name obtained from the token.
   */
  getDisplayName(obj: any): string {
    const display_name = obj.display_name
    if (!display_name) {
      this.logger.warn({
        msg: `No display_name in token for name: ${obj.name}`,
      })
    }
    return display_name || obj.name
  }

  /**
   * Retrieves the roles from the token payload.
   *
   * @param obj {any} - The decoded token payload.
   * @returns {string[]} - An array of roles obtained from the token.
   */
  getRoles(obj: any): string[] {
    const roles: string[] = []
    // Add global roles
    if (
      obj.resource_access &&
      obj.resource_access[this.cfg.globalRoleClientId] &&
      obj.resource_access[this.cfg.globalRoleClientId].roles &&
      Array.isArray(obj.resource_access[this.cfg.globalRoleClientId].roles)
    ) {
      roles.push(...obj.resource_access[this.cfg.globalRoleClientId].roles)
    }
    return roles
  }

  /**
   * Extracts namespaces from the token's resource access.
   *
   * @param obj {any} - The decoded token payload.
   * @returns {KeyCloakNamespace[]} - An array of KeyCloakNamespace objects representing namespaces.
   */
  getNamespaces(obj: any): KeyCloakNamespace[] {
    const namespaces: KeyCloakNamespace[] = []
    this.logger.debug({ msg: 'Extracting namespaces from token' })
    for (const [id, resourceAccess] of Object.entries(obj.resource_access)) {
      const namespaceResource = id.split('_')

      if (
        namespaceResource.length !== 2 ||
        namespaceResource[0] !== 'NAMESPACE' ||
        !namespaceResource[1] ||
        Number.isNaN(namespaceResource[1])
      ) {
        continue
      }

      const roles = (resourceAccess as any).roles || []
      const name = namespaceResource[2]
      namespaces.push({
        id: Number(namespaceResource[1]),
        name,
        roles,
        users: [obj.preferred_username],
        type: 'KeyCloakUser',
      })
    }

    return namespaces
  }

  /**
   * Fetches the OpenID Endpoint Configuration from Keycloak.
   *
   * @param wellKnownEndpoint {string} - The .well-known endpoint URL to fetch from.
   * @returns {Promise<{ introspection_endpoint: string; token_endpoint: string }>} - A Promise that resolves to a JSON object containing the OpenID Connect Endpoints (introspection_endpoint and token_endpoint).
   */
  async getOpenIdConnectEndpoints(
    wellKnownEndpoint: string,
  ): Promise<{ introspection_endpoint: string; token_endpoint: string }> {
    try {
      const config: RequestInit = {
        method: 'GET',
      }

      if (this.cfg.useProxyAgent) {
        config.agent = this.proxyAgent
      }

      const response = await fetch(wellKnownEndpoint, config)

      const res = await response.json()

      const endpoints = { introspection_endpoint: '', token_endpoint: '' }
      if (res) {
        if ('introspection_endpoint' in res && 'token_endpoint' in res) {
          endpoints.introspection_endpoint = res.introspection_endpoint
          endpoints.token_endpoint = res.token_endpoint
        } else {
          return Promise.reject()
        }
        return endpoints
      } else {
        return Promise.reject()
      }
    } catch (err) {
      return Promise.reject()
    }
  }

  /**
   * Asynchronously introspects a token to determine its validity and current state.
   * This method sends a request to the authorization server to verify the token's status.
   *
   * @param req {Request} - A request object representing the token to be introspected.
   *   This request typically includes the token as well as any additional information or headers required
   *   for the introspection process.
   *
   * @returns {Promise<boolean>} - A Promise that resolves to a boolean value indicating whether the token is valid.
   *   - `true` if the token is valid and its current state is active.
   *   - `false` if the token is invalid, expired, or its state is not active.
   *
   * @throws {Error} If there are issues with the introspection process, such as network errors, invalid request, or server unavailability.
   *
   * @example
   * const request = createIntrospectionRequest(token);
   * try {
   *   const isValidToken = await introspectToken(request);
   *   if (isValidToken) {
   *     // Token is valid and active.
   *     // Perform authenticated actions.
   *   } else {
   *     // Token is invalid or inactive.
   *     // Handle accordingly, e.g., re-authenticate the user.
   *   }
   * } catch (error) {
   *   // Handle introspection error.
   *   console.error(`Token introspection failed: ${error.message}`);
   * }
   */
  async introspectToken(req: Request): Promise<boolean> {
    if (this.cfg.enabled === 'off') {
      return false
    }
    this.logger.debug({ msg: 'Introspecting token' })

    if (!req.headers || !req.headers['authorization']) {
      throw new BadRequestException('Authorization header is missing.')
    }
    const authorizationHeader = req.headers['authorization']
    const [bearerType, token] = authorizationHeader.split(' ')

    if (bearerType.toLowerCase() !== 'bearer') {
      throw new BadRequestException(
        'Authorization header is not using Bearer token.',
      )
    }

    const config: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `client_id=${this.cfg.clientId}&client_secret=${this.cfg.clientSecret}&token=${token}`,
    }

    if (this.cfg.useProxyAgent) {
      config.agent = this.proxyAgent
    }

    const res = await fetch(this.OIDCEndpoints.introspection_endpoint, config)

    if (res) {
      if (res.status !== 200) {
        throw new InternalServerErrorException(
          `Token introspection failed with status ${res.status}`,
        )
      }

      const json = (await res.json()) as any

      if (json && typeof json.active === 'boolean') {
        return json.active
      } else {
        throw new InternalServerErrorException(
          'Invalid response from token introspection',
        )
      }
    } else {
      throw new InternalServerErrorException(
        'Token introspection request failed',
      )
    }
  }

  async getServiceAccountToken(): Promise<ServiceAccountToken> {
    if (this.serviceAccountToken && !this.serviceAccountToken.isExpired()) {
      return this.serviceAccountToken
    }

    const config: RequestInit = {
      method: 'POST',
      headers: {
        Authorization:
          'Basic ' +
          Buffer.from(`${this.cfg.clientId}:${this.cfg.clientSecret}`).toString(
            'base64',
          ),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `client_id=${this.cfg.clientId}&client_secret=${this.cfg.clientSecret}&grant_type=client_credentials`,
    }

    if (this.cfg.useProxyAgent) {
      config.agent = this.proxyAgent
    }

    const issuedAt = new Date()
    const res = await fetch(this.OIDCEndpoints.token_endpoint, config)

    if (!res) {
      throw new InternalServerErrorException(
        'Did not receive a response from Keycloak token endpoint',
      )
    }

    if (res.status !== 200) {
      throw new InternalServerErrorException(
        `Retrieving service account token failed with status ${res.status}`,
      )
    }

    const json = (await res.json()) as any

    if (!json || !json.access_token || !json.expires_in) {
      throw new InternalServerErrorException(
        'Keycloak service account token has invalid format',
      )
    }

    const token = new ServiceAccountToken(
      json.access_token,
      json.expires_in,
      issuedAt,
    )
    this.serviceAccountToken = token
    return this.serviceAccountToken
  }

  async getClientIdFromName(clientName: string): Promise<string> {
    const serviceAccountToken = await this.getServiceAccountToken()
    let clientEndpoint = `${this.cfg.adminUrl}/clients?clientId=${clientName}`
    const config: RequestInit = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${serviceAccountToken.access_token}`,
        'Content-Type': 'application/json',
      },
    }

    if (this.cfg.useProxyAgent) {
      config.agent = this.proxyAgent
    }

    let res = await fetch(clientEndpoint, config)

    if (res.status == 404) {
      clientEndpoint = `${this.cfg.server}/auth/admin/realms/${this.cfg.realm}/clients?clientId=${clientName}`
      res = await fetch(clientEndpoint, config)
    }

    if (!res) {
      throw new InternalServerErrorException(
        'Did not receive a response from client request',
      )
    }

    if (res.status !== 200) {
      throw new InternalServerErrorException(
        `Retrieving client id failed with status ${res.status}`,
      )
    }

    const json = (await res.json()) as any

    if (!json || !Array.isArray(json)) {
      throw new InternalServerErrorException(
        `Keycloak response has an invalid format`,
      )
    }

    if (json.length === 0) {
      throw new InternalServerErrorException(
        `Client with name ${clientName} not found`,
      )
    }

    if (json.length > 1) {
      throw new InternalServerErrorException(
        `Multiple clients with name ${clientName} found`,
      )
    }

    return json[0].id
  }

  async getAccessTokenFromClient(
    client_uuid: string,
    userId: string,
    additionalScopes: string[],
  ): Promise<string> {
    const serviceAccountToken = await this.getServiceAccountToken()
    const exampleAccessTokenEndpoint = `${this.cfg.adminUrl}/clients/${client_uuid}/evaluate-scopes/generate-example-access-token`

    const uniqueScopes = new Set(additionalScopes)
    uniqueScopes.add('openid')

    const urlEncodedScopes = [...uniqueScopes].join('%20')
    const queryString = `?scope=${urlEncodedScopes}&userId=${userId}`

    const config: RequestInit = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${serviceAccountToken.access_token}`,
      },
    }

    if (this.cfg.useProxyAgent) {
      config.agent = this.proxyAgent
    }

    let res = await fetch(exampleAccessTokenEndpoint + queryString, config)

    if (res.status == 404) {
      const exampleAccessTokenEndpoint = `${this.cfg.server}/auth/admin/realms/${this.cfg.realm}/clients/${client_uuid}/evaluate-scopes/generate-example-access-token`
      res = await fetch(exampleAccessTokenEndpoint + queryString, config)
    }

    if (!res) {
      throw new InternalServerErrorException(
        'Did not receive a response from example token request',
      )
    }

    if (res.status !== 200) {
      throw new InternalServerErrorException(
        `Retrieving example token failed with status ${res.status}`,
      )
    }

    const json = (await res.json()) as any

    if (!json) {
      throw new InternalServerErrorException(
        `Keycloak response has an invalid format`,
      )
    }

    return json
  }

  async getUsersOfClientRole(
    clientName: string,
    roleName: string,
  ): Promise<InternalKeycloakUser[]> {
    const serviceAccountToken = await this.getServiceAccountToken()
    const clientId = await this.getClientIdFromName(clientName)
    const roleEndpoint = `${this.cfg.adminUrl}/clients/${clientId}/roles/${roleName}/users`
    const config: RequestInit = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${serviceAccountToken.access_token}`,
        'Content-Type': 'application/json',
      },
    }

    if (this.cfg.useProxyAgent) {
      config.agent = this.proxyAgent
    }

    let res = await fetch(roleEndpoint, config)

    if (res.status == 404) {
      const roleEndpoint = `${this.cfg.server}/auth/admin/realms/${this.cfg.realm}/clients/${clientId}/roles/${roleName}/users`
      res = await fetch(roleEndpoint, config)
    }

    if (!res) {
      throw new InternalServerErrorException(
        'Did not receive a response from users request',
      )
    }

    if (res.status !== 200) {
      throw new InternalServerErrorException(
        `Retrieving users of client role failed with status ${res.status}`,
      )
    }

    const json = (await res.json()) as any

    if (!json || !Array.isArray(json)) {
      throw new InternalServerErrorException(
        `Keycloak response has an invalid format`,
      )
    }

    const users: InternalKeycloakUser[] = json.map(this.extractUser.bind(this))

    return users
  }

  extractUser(obj: any): InternalKeycloakUser {
    const id = obj.id
    const username = obj.username
    const firstName = obj.firstName
    const lastName = obj.lastName
    let displayName = firstName + ' ' + lastName
    const email = obj.email
    if (
      obj.attributes &&
      obj.attributes.display_name &&
      obj.attributes.display_name.length > 0
    ) {
      displayName = obj.attributes.display_name[0]
    } else {
      this.logger.warn({
        msg: `No display name found for user ${username}`,
      })
    }
    return {
      id,
      username,
      firstName,
      lastName,
      displayName,
      email,
    }
  }

  async getUsersOfNamespace(
    namespaceId: number,
  ): Promise<KeyCloakUserOfRole[]> {
    const namespaceClientName = `${this.cfg.namespaceClientNamePrefix}_${namespaceId}`
    const users = await this.getUsersOfClientRole(
      namespaceClientName,
      this.cfg.namespaceAccessRoleName,
    )

    return users.map(this.toKeycloakUserOfRole)
  }

  toKeycloakUserOfRole(user: InternalKeycloakUser): KeyCloakUserOfRole {
    return {
      kc_id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      firstName: user.firstName,
      lastName: user.lastName,
    }
  }

  /**
   * @param id The keycloak user id (e.g. sub)
   * @returns
   * @throws {InternalServerErrorException} If the request fails or the response is invalid.
   */

  async getUserById(id: string): Promise<KeyCloakUserOfRole> {
    const serviceAccountToken = await this.getServiceAccountToken()
    const userEndpoint = `${this.cfg.adminUrl}/users/${id}`
    const config: RequestInit = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${serviceAccountToken.access_token}`,
        'Content-Type': 'application/json',
      },
    }

    if (this.cfg.useProxyAgent) {
      config.agent = this.proxyAgent
    }

    let res = await fetch(userEndpoint, config)

    if (res.status == 404) {
      const userEndpoint = `${this.cfg.server}/auth/admin/realms/${this.cfg.realm}/users/${id}`
      res = await fetch(userEndpoint, config)
    }

    if (!res) {
      throw new InternalServerErrorException(
        'Did not receive a response from user request',
      )
    }

    if (res.status === 404) {
      throw new MissingUserError(`User with id ${id} not found`)
    }

    if (res.status !== 200) {
      throw new InternalServerErrorException(
        `Retrieving user by user id failed with status ${res.status}`,
      )
    }

    const json = (await res.json()) as any

    if (!json || !json.id) {
      throw new InternalServerErrorException(
        `Keycloak response has an invalid format`,
      )
    }

    const user = this.extractUser(json)
    return this.toKeycloakUserOfRole(user)
  }

  /**
   * @param username The keycloak username
   * @returns
   * @throws {InternalServerErrorException} If the request fails or the response is invalid.
   */
  async getUserByUsername(username: string): Promise<KeyCloakUserOfRole> {
    const serviceAccountToken = await this.getServiceAccountToken()
    const userEndpoint = `${this.cfg.adminUrl}/users?username=${username}`
    const config: RequestInit = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${serviceAccountToken.access_token}`,
        'Content-Type': 'application/json',
      },
    }

    if (this.cfg.useProxyAgent) {
      config.agent = this.proxyAgent
    }

    let res = await fetch(userEndpoint, config)

    if (res.status == 404) {
      const userEndpoint = `${this.cfg.server}/auth/admin/realms/${this.cfg.realm}/users?username=${username}`
      res = await fetch(userEndpoint, config)
    }

    if (!res) {
      throw new InternalServerErrorException(
        'Did not receive a response from user request',
      )
    }

    if (res.status === 404) {
      throw new MissingUserError(`User with username ${username} not found`)
    }

    if (res.status !== 200) {
      throw new InternalServerErrorException(
        `Retrieving user by username failed with status ${res.status}`,
      )
    }

    const json = (await res.json()) as any

    if (!json || !Array.isArray(json)) {
      throw new InternalServerErrorException(
        `Keycloak response has an invalid format`,
      )
    }

    if (json.length === 0) {
      throw new InternalServerErrorException(
        `User with username ${username} not found`,
      )
    }

    if (json.length > 1) {
      throw new InternalServerErrorException(
        `Multiple users with username ${username} found`,
      )
    }

    const user = this.extractUser(json[0])
    return this.toKeycloakUserOfRole(user)
  }
}
