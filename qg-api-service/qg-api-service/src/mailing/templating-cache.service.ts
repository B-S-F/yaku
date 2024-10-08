import {
  availableTemplates,
  NotificationType,
  TemplateMap,
} from './mailing.utils'
// Must be imported like this because of the way the module is exported https://github.com/mjmlio/mjml/issues/2430
import { Injectable, OnApplicationBootstrap } from '@nestjs/common'
import * as ejs from 'ejs'
import { readdir, readFile } from 'fs/promises'
import mjml2html from 'mjml'
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino'

@Injectable()
export class TemplatingCache implements OnApplicationBootstrap {
  @InjectPinoLogger(TemplatingCache.name)
  private readonly logger = new PinoLogger({
    pinoHttp: {
      level: 'trace',
      serializers: {
        req: () => undefined,
        res: () => undefined,
      },
    },
  })
  private templatePath: string
  private templates: TemplateMap

  constructor(templatePath: string) {
    this.templates = new Map<NotificationType, ejs.TemplateFunction>()
    this.templatePath = templatePath
  }

  public has(template: NotificationType): boolean {
    return this.templates.has(template)
  }

  public get(template: NotificationType): ejs.TemplateFunction {
    const compiledTemplate = this.templates.get(template)
    if (!compiledTemplate) {
      throw new Error(`Template ${template} not found`)
    }
    return compiledTemplate
  }

  async onApplicationBootstrap(): Promise<void> {
    const files = await readdir(this.templatePath, {
      encoding: 'utf-8',
      withFileTypes: true,
    })
    const mjmlFiles = files.filter(
      (file) => file.isFile() && file.name.endsWith('.mjml')
    )

    for (const file of mjmlFiles) {
      if (!availableTemplates.includes(file.name as NotificationType)) {
        this.logger.warn(
          `Template ${file.name} is not in the list of supported templates, ignoring. Supported templates: ${availableTemplates}`
        )
        continue
      }
      try {
        const content = await readFile(`${this.templatePath}/${file.name}`, {
          encoding: 'utf-8',
        })
        this.add(file.name as NotificationType, content)
      } catch (error) {
        throw new Error(`Template ${file.name} could not be compiled: ${error}`)
      }
    }

    for (const template of availableTemplates) {
      if (!this.templates.has(template)) {
        throw new Error(
          `Template for ${template} not found in ${this.templatePath}`
        )
      }
    }
  }

  private add(template: NotificationType, content: string): void {
    const ejsTemplate = mjml2html(content).html
    const compiledTemplate = ejs.compile(ejsTemplate)
    this.templates.set(template, compiledTemplate)
  }
}
