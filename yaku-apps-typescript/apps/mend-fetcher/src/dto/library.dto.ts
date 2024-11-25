export class LibraryDTO {
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
    public licenses: {
      uuid: string
      name: string
      assignedByUser: boolean
      licenseReferences: {
        uuid: string
        type: string
        liabilityReference: string
        information: string
      }[]
    }[],
    public copyrightReferences: {
      type: string
      copyright: string
      author: string
      referenceInfo: string
      startYear?: string
      endYear?: string
    }[],
    public locations: {
      localPath: string
      dependencyFile: string
    }[],
  ) {}
}
