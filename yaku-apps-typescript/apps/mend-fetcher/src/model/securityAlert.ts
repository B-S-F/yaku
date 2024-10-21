import { IAlert } from './alert.js'
import { ILibraryComponent } from './libraryComponent.js'
import { Project } from './project.js'
import { Vulnerability } from './vulnerability.js'
import { VulnerabilityFix } from './vulnerabilityFix.js'

export class SecurityAlert implements IAlert {
  constructor(
    public uuid: string,
    public name: string,
    public type: string,
    public component: ILibraryComponent,
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
    public vulnerability: Vulnerability,
    public topFix: VulnerabilityFix,
    public effective: string
  ) {}
}
