import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { Logger, PinoLogger } from 'nestjs-pino'
import { Observable, catchError, tap, throwError } from 'rxjs'
import { QG_LOG_LEVEL } from './config'

@Injectable()
export class PinoLoggingInterceptor implements NestInterceptor {
  private readonly logger: Logger = new Logger(
    new PinoLogger({
      pinoHttp: {
        level: QG_LOG_LEVEL,
        serializers: {
          req: () => undefined,
          res: () => undefined,
        },
      },
    }),
    {}
  )

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>
  ): Observable<any> | Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest()
    const user = context.getArgs()[0].user
    const userId = user ? user.username : undefined
    const traceId = context.getArgs()[0].id
    this.logger.debug({
      path: request.originalUrl,
      method: request.method,
      userId: userId,
      traceId: traceId,
    })

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse()
        this.logger.debug({
          path: request.originalUrl,
          method: request.method,
          status: response.statusCode,
          userId: userId,
          traceId: traceId,
        })
      }),
      catchError((err) => {
        this.logger.debug({
          path: request.originalUrl,
          method: request.method,
          status: err.status,
          userId: userId,
          traceId: traceId,
        })
        if (err.cause) {
          this.logger.debug({
            msg: `Request ${traceId}: failed with cause: ${err.cause}`,
            userId: userId,
            traceId: traceId,
          })
        }
        return throwError(() => err)
      })
    )
  }
}
