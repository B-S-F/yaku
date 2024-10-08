import { validateId } from '@B-S-F/api-commons-lib'
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { ADMIN_ROLE, NAMESPACE_ACCESS_ROLE } from '../../guards/roles.guard'

@Injectable()
export class NamespaceAccessGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    if (request.requiresRoles?.includes(ADMIN_ROLE)) return true
    const namespaceId = Number(request.params.namespaceId)
    if (!namespaceId) return true
    validateId(namespaceId)
    const user = request.user
    if (!user) return false
    return (
      user.namespaces.filter(
        (ns) =>
          ns.id === namespaceId && ns.roles.includes(NAMESPACE_ACCESS_ROLE)
      ).length > 0
    )
  }
}
