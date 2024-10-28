import { KeyCloakUser } from '@B-S-F/api-keycloak-auth-lib'
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'

export const ROLES_KEY = 'roles'
export const ADMIN_ROLE = 'admin'
export const USER_ROLE = 'user'
export const KEYCLOAK_USER_TYPE = 'KeyCloakUser'
export const NAMESPACE_ACCESS_ROLE = 'ACCESS'

export const KEYCLOAK_ADMIN_ROLE = 'ADMIN'

export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles)

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    )
    if (!requiredRoles || requiredRoles.length === 0) {
      return true
    }
    const request = context.switchToHttp().getRequest()
    if (!request.user) return false

    const hasRole = requiredRoles.some((role) =>
      rolesOf(request.user).includes(role)
    )
    if (hasRole) {
      request.requiresRoles = requiredRoles
    }
    return hasRole
  }
}

export const rolesOf = (user: KeyCloakUser): string[] => {
  const roles = []
  if (user.roles.includes(KEYCLOAK_ADMIN_ROLE)) {
    roles.push(ADMIN_ROLE)
  } else {
    roles.push(USER_ROLE)
  }
  return roles
}
