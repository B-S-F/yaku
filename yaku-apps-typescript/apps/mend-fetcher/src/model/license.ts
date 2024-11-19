import { LicenseReference } from './licenseReference.js'

export class License {
  constructor(
    public uuid: string,
    public name: string,
    public assignedByUser: boolean,
    public licenseReferences: LicenseReference[],
  ) {}
}
