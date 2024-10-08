import { Controller } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Test, TestingModule } from '@nestjs/testing'
import { CoreAuthGuard } from './auth.guard'
import { KeyCloakAuthGuard } from './keycloak-auth.guard'
import { LoggerModule, PinoLogger, Logger } from 'nestjs-pino'
import { LongRunningTokenAuthGuard } from '../user/long-running-token/long.running.token.auth.guard'

describe('CoreAuthGuard', () => {
  type Mutable<T> = {
    -readonly [k in keyof T]: T[k]
  }

  let coreGuard: CoreAuthGuard
  let keyCloakAuthGuard: Mutable<KeyCloakAuthGuard>
  let longRunningTokenAuthGuard: Mutable<LongRunningTokenAuthGuard>
  let module: TestingModule

  let reflector: Reflector

  const handler = { handler: true }
  const controllerClass = Controller.prototype
  const context: any = {
    getHandler: () => handler,
    getClass: () => controllerClass,
  }

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [LoggerModule.forRoot({})],
      providers: [
        CoreAuthGuard,
        {
          provide: KeyCloakAuthGuard,
          useValue: {
            canActivate: jest.fn(),
          },
        },
        {
          provide: LongRunningTokenAuthGuard,
          useValue: {
            canActivate: jest.fn(),
          },
        },
        {
          provide: PinoLogger,
          useValue: { pinoHttp: jest.fn() },
        },
        {
          provide: Logger,
          useValue: { debug: jest.fn(), error: jest.fn() },
        },
      ],
    }).compile()

    coreGuard = module.get<CoreAuthGuard>(CoreAuthGuard)
    keyCloakAuthGuard =
      module.get<Mutable<KeyCloakAuthGuard>>(KeyCloakAuthGuard)
    longRunningTokenAuthGuard = module.get<Mutable<LongRunningTokenAuthGuard>>(
      LongRunningTokenAuthGuard
    )
  })

  it('should be defined', () => {
    expect(coreGuard).toBeDefined()
  })

  it.each([
    {
      keyCloakAuth: true,
      longRunningTokenAuth: true,
      expected: true,
    },
    {
      keyCloakAuth: false,
      longRunningTokenAuth: true,
      expected: true,
    },
    {
      keyCloakAuth: true,
      longRunningTokenAuth: false,
      expected: true,
    },
    {
      keyCloakAuth: false,
      longRunningTokenAuth: false,
      expected: false,
    },
  ])('should fulfill %p', async (input) => {
    const keyCloakAuthGuardSpy = jest
      .spyOn(keyCloakAuthGuard, 'canActivate')
      .mockResolvedValue(input.keyCloakAuth)
    const longRunningTokenAuthGuardSpy = jest
      .spyOn(longRunningTokenAuthGuard, 'canActivate')
      .mockResolvedValue(input.longRunningTokenAuth)

    const result = await coreGuard.canActivate(context)

    expect(result).toBe(input.expected)
    expect(keyCloakAuthGuardSpy).toHaveBeenCalledWith(context)
    expect(longRunningTokenAuthGuardSpy).toHaveBeenCalledWith(context)
  })

  it('should throw an Unauthorized exception if keycloak auth guard throws an error', async () => {
    const keyCloakAuthGuardSpy = jest
      .spyOn(keyCloakAuthGuard, 'canActivate')
      .mockRejectedValue(new Error('test'))

    await expect(coreGuard.canActivate(context)).rejects.toThrowError(
      'Unauthorized'
    )

    expect(keyCloakAuthGuardSpy).toHaveBeenCalledWith(context)
  })

  it('should throw an Unauthorized exception if long running token auth guard throws an error', async () => {
    const longRunningTokenAuthGuardSpy = jest
      .spyOn(longRunningTokenAuthGuard, 'canActivate')
      .mockRejectedValue(new Error('test'))

    await expect(coreGuard.canActivate(context)).rejects.toThrowError(
      'Unauthorized'
    )

    expect(longRunningTokenAuthGuardSpy).toHaveBeenCalledWith(context)
  })

  it('should throw no error if all two auth guards throw no error and fail to activate', async () => {
    const keyCloakAuthGuardSpy = jest
      .spyOn(keyCloakAuthGuard, 'canActivate')
      .mockResolvedValue(false)
    const longRunningTokenAuthGuardSpy = jest
      .spyOn(longRunningTokenAuthGuard, 'canActivate')
      .mockRejectedValue(false)

    await expect(coreGuard.canActivate(context)).resolves.toBeFalsy()

    expect(keyCloakAuthGuardSpy).toHaveBeenCalledWith(context)
    expect(longRunningTokenAuthGuardSpy).toHaveBeenCalledWith(context)
  })
})
