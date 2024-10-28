import { IsPublicAPI } from '@B-S-F/api-commons-lib'
import { Controller, ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Test, TestingModule } from '@nestjs/testing'
import { KeyCloakAuthGuard } from './keycloak-auth.guard'

describe('KeyCloakAuthGuard', () => {
  type Mutable<T> = {
    -readonly [k in keyof T]: T[k]
  }

  let guard: KeyCloakAuthGuard
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
      providers: [
        KeyCloakAuthGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile()

    guard = module.get<KeyCloakAuthGuard>(KeyCloakAuthGuard)
    reflector = module.get<Reflector>(Reflector)
  })

  it('should be defined', () => {
    expect(guard).toBeDefined()
  })

  it('should return true for a public endpoint', async () => {
    const reflectorSpy = jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(true)

    const activate = await guard.canActivate(context)

    expect(activate).toBeTruthy()
    expect(reflectorSpy).toBeCalledWith(IsPublicAPI, [handler, controllerClass])
  })

  it('should check the token strategies for a non-public endpoint', async () => {
    let calledProperly = false
    const mGuard = guard as Mutable<KeyCloakAuthGuard>
    mGuard['checkTokenStrategies'] = (ctx: ExecutionContext) => {
      if (context == ctx) {
        calledProperly = true
        return false
      }
    }
    const reflectorSpy = jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(false)

    const activate = await guard.canActivate(context)

    expect(activate).toBeFalsy()
    expect(reflectorSpy).toBeCalledWith(IsPublicAPI, [handler, controllerClass])
    expect(calledProperly).toBeTruthy()
  })
})
