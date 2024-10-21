import { IAlertDTO } from './alert.dto.js'
import { IBaseComponentDTO } from './baseComponent.dto.js'

export class RejectedInUseAlertDTO implements IAlertDTO {
  constructor(
    public uuid: string,
    public name: string,
    public type: string,
    public component: IBaseComponentDTO,
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
    public project: {
      uuid: string
      name: string
      path: string
      productUuid: string
    },
    public description: string
  ) {}
}
