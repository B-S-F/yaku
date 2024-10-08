import { Injectable } from '@nestjs/common'

@Injectable()
export class ServiceConfig {
  constructor(
    readonly servicePort: number,
    readonly pathPrefix: string,
    readonly serviceVersion: string,
    readonly imageVersion: string
  ) {}
}

export function getServiceVersion(): string {
  try {
    const pkg = require('../package.json')
    return pkg.version
  } catch (err) {
    return 'n/a'
  }
}
