export class ProjectDTO {
  constructor(
    public uuid: string,
    public name: string,
    public path: string,
    public productName: string,
    public productUuid: string
  ) {}
}
