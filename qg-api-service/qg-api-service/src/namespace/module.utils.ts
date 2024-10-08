import { KeyCloakUser } from '@B-S-F/api-keycloak-auth-lib'
import { InternalServerErrorException } from '@nestjs/common'
import { Request } from 'express'
/**
 * RequestUser is the main abstraction representing the user that is making a request.
 * It must be used to persist the user during the request lifecycle.
 * In order to retrieve the user from the request, the function `getUserFromRequest` must be used.
 *
 * @example
 * The following example demonstrates how to use the RequestUser object.
 * ```ts
 * const user = new RequestUser('id', 'username', 'email@host.invalid', 'displayName')
 * ```
 */
export class RequestUser {
  constructor(
    readonly id: string,
    readonly username: string,
    readonly email: string,
    readonly displayName: string
  ) {}
}

export const SYSTEM_REQUEST_USER_ID = '00000000-0000-0000-0000-000000000000'

export const SYSTEM_REQUEST_USER = new RequestUser(
  SYSTEM_REQUEST_USER_ID,
  'SYSTEM_ACTOR',
  'system@actor.invalid',
  'Sytem actor (machine user)'
)

/**
 * Retrieves the user from the request.
 * @param request The request object.
 * @returns The user object.
 *
 * @example
 * The following example demonstrates how to retrieve the user from the request on controller level.
 * ```ts
 * async controllerFunction(@Req() request: Request): Promise<Dto> {
 *    const user = getUserFromRequest(request) # RequestUser is now the user object
 *    ...
 * }
 * ```
 */
export function getUserFromRequest(request: Request): RequestUser {
  const user = request.user as KeyCloakUser
  if (!user) {
    throw new InternalServerErrorException('User not found in request')
  }

  if (!user.kc_sub) {
    throw new InternalServerErrorException('Keycloak id not found in user')
  } else {
    return new RequestUser(
      user.kc_sub,
      user.username,
      user.email,
      user.displayName
    )
  }
}
