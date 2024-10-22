import { IAlert } from './alert.js'
import { IBaseComponent } from './baseComponent.js'
import { Project } from './project.js'

export class NewVersionsAlert implements IAlert {
  constructor(
    public uuid: string,
    public name: string,
    public type: string,
    public component: IBaseComponent,
    public alertInfo: {
      status: string
      comment:
        | {
            comment: string
            date: string
          }
        | Record<string, never>
      detectedAt: string
      modifiedAt: string
    },
    public project: Project,
    public product: {
      uuid: string
      name: string
    },
    public availableVersion: string,
    public availableVersionType: string
  ) {}
}
