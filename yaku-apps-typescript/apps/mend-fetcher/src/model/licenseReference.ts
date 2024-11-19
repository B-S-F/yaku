export class LicenseReference {
  constructor(
    public uuid: string,
    public type: string,
    public liabilityReference: string,
    public information: string,
  ) {}
}
