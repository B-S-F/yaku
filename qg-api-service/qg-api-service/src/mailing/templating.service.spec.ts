import { REQUEST } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import { TemplateFunction } from 'ejs'
import { Request } from 'express'
import { NotificationType } from './mailing.utils'
import { TemplatingCache } from './templating-cache.service'
import {
  TemplatingConfiguration,
  TemplatingService,
} from './templating.service'

describe('TemplatingService', () => {
  let templatingService: TemplatingService
  let configuration: TemplatingConfiguration
  let templatingCache: TemplatingCache
  let request: Request

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TemplatingService,
        {
          provide: TemplatingConfiguration,
          useValue: configuration,
        },
        {
          provide: TemplatingCache,
          useValue: {
            has: jest.fn(),
            get: jest.fn(),
          },
        },
        {
          provide: REQUEST,
          useValue: request,
        },
      ],
    }).compile()

    templatingService = module.get<TemplatingService>(TemplatingService)
    templatingCache = module.get<TemplatingCache>(TemplatingCache)
    configuration = {
      instanceName: 'production',
      uiURL: 'https://portal.bswf.tech',
      uiSettingsPath: '/settings',
      yakuTeam: 'Yaku Team',
    }
    request = {
      protocol: 'https',
      headers: {
        origin: 'https://portal.bswf.tech',
      },
    } as Request
  })

  it('should instantiate a new TemplatingService', () => {
    expect(templatingService).toBeDefined()
  })

  it('should return a template for a notification', () => {
    jest.spyOn(templatingCache, 'has').mockReturnValue(true)
    jest
      .spyOn(templatingCache, 'get')
      .mockReturnValue(
        (() => (data: any) => 'test') as unknown as TemplateFunction
      )
    const notification = {
      type: NotificationType.Comment,
      data: {
        name: 'test',
      },
    }
    const template = templatingService.Template(notification)
    expect(template).toBeDefined()
  })

  it('should call the templating with the correct data', () => {
    jest.spyOn(templatingCache, 'has').mockReturnValue(true)
    jest.spyOn(templatingCache, 'get').mockReturnValue(((data: any) => {
      expect(data).toEqual({
        name: 'test',
        instance_name: 'production',
        yaku_team: 'Yaku Team',
        ui_settings_url: 'https://portal.bswf.tech/settings',
        ui_url: 'https://portal.bswf.tech',
      })
      return 'test'
    }) as unknown as TemplateFunction)
    const notification = {
      type: NotificationType.Comment,
      data: {
        name: 'test',
      },
    }
    const template = templatingService.Template(notification)
    expect(template).toBeDefined()
  })
})
