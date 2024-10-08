import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common'
import { ServiceConfig } from './service-config'

export function mainConfig(app: INestApplication) {
  app.enableCors()
  const serviceConfig: ServiceConfig = app.get(ServiceConfig)
  app.setGlobalPrefix(`${serviceConfig.pathPrefix}/api`)
  app.enableVersioning({
    defaultVersion: '1',
    type: VersioningType.URI,
  })
  app.useGlobalPipes(new ValidationPipe({ transform: true }))
}
