import { ExecutionContext, HttpException } from '@nestjs/common'
import { InteractiveLoginGuard } from './interactive.login.guard'

describe('Interactive login guard', () => {
  it('Absent user denies', () => {
    const context: Partial<
      Record<
        jest.FunctionPropertyNames<ExecutionContext>,
        jest.MockedFunction<any>
      >
    > = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn(),
      }),
    }

    const guard = new InteractiveLoginGuard()
    context.switchToHttp().getRequest.mockReturnValue({})

    const canActivate = guard.canActivate(context as ExecutionContext)
    expect(canActivate).toBeFalsy()
  })

  it('Absent interactive_login field denies', () => {
    const context: Partial<
      Record<
        jest.FunctionPropertyNames<ExecutionContext>,
        jest.MockedFunction<any>
      >
    > = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn(),
      }),
    }

    const guard = new InteractiveLoginGuard()
    context.switchToHttp().getRequest.mockReturnValue({ user: {} })

    const canActivate = guard.canActivate(context as ExecutionContext)
    expect(canActivate).toBeFalsy()
  })

  it('Non boolean interactive_login field denies', () => {
    const context: Partial<
      Record<
        jest.FunctionPropertyNames<ExecutionContext>,
        jest.MockedFunction<any>
      >
    > = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn(),
      }),
    }

    const guard = new InteractiveLoginGuard()
    context
      .switchToHttp()
      .getRequest.mockReturnValue({ user: { interactive_login: 23 } })

    const canActivate = guard.canActivate(context as ExecutionContext)
    expect(canActivate).toBeFalsy()
  })

  it('False interactive_login field denies', () => {
    const context: Partial<
      Record<
        jest.FunctionPropertyNames<ExecutionContext>,
        jest.MockedFunction<any>
      >
    > = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn(),
      }),
    }

    const guard = new InteractiveLoginGuard()
    context.switchToHttp().getRequest.mockReturnValue({
      user: { interactive_login: false },
    })

    expect(() => guard.canActivate(context as ExecutionContext)).toThrow(
      HttpException
    )
  })

  it('True interactive_login field activates', () => {
    const context: Partial<
      Record<
        jest.FunctionPropertyNames<ExecutionContext>,
        jest.MockedFunction<any>
      >
    > = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn(),
      }),
    }

    const guard = new InteractiveLoginGuard()
    context.switchToHttp().getRequest.mockReturnValue({
      user: { interactive_login: true },
    })

    const canActivate = guard.canActivate(context as ExecutionContext)
    expect(canActivate).toBeTruthy()
  })
})
