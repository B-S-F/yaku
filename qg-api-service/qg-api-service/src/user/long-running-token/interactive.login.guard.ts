import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { KeyCloakUser } from '@B-S-F/api-keycloak-auth-lib'

@Injectable()
export class InteractiveLoginGuard implements CanActivate {
  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest()

    if (request.user === undefined) return false

    const keyCloakUser = request.user as KeyCloakUser

    if (keyCloakUser.interactive_login === undefined) {
      return false
    }

    if (typeof keyCloakUser.interactive_login !== 'boolean') {
      return false
    }

    if (!keyCloakUser.interactive_login) {
      throw new HttpException(
        'This action requires an interactive login - you are logged in with a long running token',
        HttpStatus.FORBIDDEN
      )
    }

    return true
  }
}
