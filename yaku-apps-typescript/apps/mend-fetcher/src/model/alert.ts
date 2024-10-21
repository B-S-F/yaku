import { IBaseComponent } from './baseComponent.js'
import { ILibraryComponent } from './libraryComponent.js'
import { Project } from './project.js'

export interface IAlert {
  uuid: string
  name: string
  type: string
  component: IBaseComponent | ILibraryComponent
  alertInfo: {
    status: string
    comment:
      | {
          comment: string
          date: string
        }
      | Record<string, never>
    detectedAt: string
    modifiedAt: string
  }
  project: Project
  product: {
    uuid: string
    name: string
  }
}
