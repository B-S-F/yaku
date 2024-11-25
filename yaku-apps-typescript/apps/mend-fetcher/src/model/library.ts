import { CopyrightReference } from './copyrightReference.js'
import { License } from './license.js'

export class Library {
  constructor(
    public uuid: string,
    public name: string,
    public artifactId: string,
    public version: string,
    public architecture: string,
    public languageVersion: string,
    public classifier: string,
    public extension: string,
    public sha1: string,
    public description: string,
    public type: string,
    public directDependency: boolean,
    public licenses: License[],
    public copyrightReferences: CopyrightReference[],
    public locations: {
      localPath: string
      dependencyFile: string
    }[],
  ) {}
}
