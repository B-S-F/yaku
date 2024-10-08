import { Inject, Injectable } from '@nestjs/common'
import { Data } from 'ejs'
import { Notification, NotificationType } from './mailing.utils'
import { TemplatingCache } from './templating-cache.service'

export type InstanceName =
  | 'production'
  | 'qa'
  | 'development'
  | 'bcn-internal-production'
  | 'bcn-internal-qa'
  | 'bcn-internal-development'

@Injectable()
export class TemplatingConfiguration {
  readonly instanceName: InstanceName
  readonly uiURL: string
  readonly uiSettingsPath: string
  readonly yakuTeam: string

  /**
   * Templating configuration
   * @param instanceName - The name of the api instance
   * @param uiURL - The fallback URL for the UI (if the request does not come from the UI we still have to template the email and provide a link to the UI)
   * @param uiSettingsPath - The path to the UI settings (e.g. /settings)
   * @param yakuTeam - The name of the Yaku team (default: Yaku Team)
   */
  constructor(configuration: {
    instanceName: InstanceName
    uiURL: string
    uiSettingsPath: string
    yakuTeam?: string
  }) {
    if (
      !configuration.instanceName ||
      configuration.instanceName.trim() === '' ||
      !configuration.uiURL ||
      configuration.uiURL.trim() === '' ||
      !configuration.uiSettingsPath ||
      configuration.uiSettingsPath.trim() === ''
    ) {
      throw new Error('All configuration values are required to be set')
    }
    if (!configuration.uiSettingsPath.startsWith('/')) {
      throw new Error('uiSettingsPath must start with /')
    }
    this.instanceName = configuration.instanceName
    this.uiURL = configuration.uiURL
    this.uiSettingsPath = configuration.uiSettingsPath
    this.yakuTeam = configuration.yakuTeam || 'Yaku Team'
  }
}

@Injectable()
export class TemplatingService {
  constructor(
    @Inject(TemplatingConfiguration)
    private readonly configuration: TemplatingConfiguration,
    @Inject(TemplatingCache) private readonly cache: TemplatingCache
  ) {}

  public Template(notification: Notification): string {
    const uiSettingsUrl =
      this.configuration.uiURL + this.configuration.uiSettingsPath
    const data = {
      ...notification.data,
      instance_name: this.configuration.instanceName,
      ui_url: this.configuration.uiURL,
      ui_settings_url: uiSettingsUrl,
      yaku_team: this.configuration.yakuTeam,
    }
    return this.templateMail(notification.type, data)
  }

  private templateMail(type: NotificationType, data: Data): string {
    if (!this.cache.has(type)) {
      throw new Error(`Template ${type} not found`)
    }

    const ejsTemplate = this.cache.get(type)
    return ejsTemplate(data)
  }
}
