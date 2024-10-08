import { NestFactory } from '@nestjs/core'
import {
  DocumentBuilder,
  SwaggerCustomOptions,
  SwaggerModule,
} from '@nestjs/swagger'
import * as inspector from 'inspector'
import { Logger, PinoLogger } from 'nestjs-pino'
import { AppModule } from './app.module'
import {
  KEYCLOAK_AUTH,
  KEYCLOAK_REALM,
  KEYCLOAK_SERVER,
  QG_LOG_LEVEL,
  SWAGGER_OAUTH2_CLIENT_ID,
  SWAGGER_TITLE,
} from './config'
import { mainConfig } from './main.config'
import { ServiceConfig } from './service-config'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new Logger(
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
    ),
  })

  app.useLogger(app.get(Logger))
  const logger = app.get(Logger)

  mainConfig(app)

  const serviceConfig = app.get(ServiceConfig)
  const documentBuilder = new DocumentBuilder()
    .setTitle('Yaku Core API')
    .setDescription('Yaku API for managing configs and runs')
    .setVersion(serviceConfig.serviceVersion)
    .addBearerAuth()

  const swaggerOptions: SwaggerCustomOptions = {
    customSiteTitle: SWAGGER_TITLE,
  }

  if (KEYCLOAK_AUTH.trim() === 'on') {
    const kcServer = KEYCLOAK_SERVER.trim()
    const kcRealm = KEYCLOAK_REALM.trim()

    if (!kcServer || !kcRealm) {
      throw new Error(
        'Keycloak server and realm must be set if Keycloak is enabled'
      )
    }

    const keycloakOpenIdBaseUrl = `${KEYCLOAK_SERVER.trim()}/auth/realms/${KEYCLOAK_REALM.trim()}/protocol/openid-connect`
    documentBuilder.addOAuth2({
      type: 'oauth2',
      flows: {
        authorizationCode: {
          authorizationUrl: `${keycloakOpenIdBaseUrl}/auth?nonce=randomNonce`,
          tokenUrl: `${keycloakOpenIdBaseUrl}/token`,
          scopes: {
            openid: 'Open Id',
            global: 'Global Access',
          },
          refreshUrl: `${keycloakOpenIdBaseUrl}/token`,
        },
      },
      scheme: 'bearer',
      bearerFormat: 'JWT',
      in: 'header',
    })

    const swaggerClientId = SWAGGER_OAUTH2_CLIENT_ID.trim()

    if (!swaggerClientId) {
      throw new Error(
        'Swagger Oauth2 Client ID and Client Secret must be set if Keycloak is enabled'
      )
    }
    swaggerOptions.swaggerOptions = {
      initOAuth: {
        clientId: swaggerClientId,
        realm: kcRealm,
        appName: 'yaku-core-api',
        usePkceWithAuthorizationCodeGrant: true,
        scopes: ['openid'],
      },
    }
  }

  /*
   * Only hosting the swagger UI at the root level leads to the proper
   * redirect URI generation.
   *
   * Customarily, we host our swagger UI under /docs
   * Therefore, we configure a redirect, so that the current behavior is
   * retained.
   *
   * Ideally, we fix the swagger problem with the update to nest 10
   */

  app.getHttpAdapter().get('/docs', (req, res) => {
    res.redirect('/')
  })
  app.getHttpAdapter().get('/docs-yaml', (req, res) => {
    res.redirect('/-yaml')
  })

  const document = SwaggerModule.createDocument(app, documentBuilder.build())
  SwaggerModule.setup('/', app, document, swaggerOptions)
  logger.log({
    context: 'Bootstrap',
    msg: `Listening on port ${serviceConfig.servicePort}`,
  })
  await app.listen(serviceConfig.servicePort)
}

process.on('SIGUSR2', () => {
  try {
    console.log('Closing Debugger.')
    inspector.close()
  } catch (error) {
    console.error('Error closing debugger:', error)
  }
})

void bootstrap()
