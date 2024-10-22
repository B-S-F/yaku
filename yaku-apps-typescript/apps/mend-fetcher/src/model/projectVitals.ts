export class ProjectVitals {
  constructor(
    public lastScan: string,
    public lastUserScanned: {
      uuid: string
      name: string
      email: string
      userType: string
    },
    public requestToken: string,
    public lastSourceFileMatch: string,
    public lastScanComment: string,
    public projectCreationDate: string,
    public pluginName: string,
    public pluginVersion: string,
    public libraryCount: number
  ) {}
}
