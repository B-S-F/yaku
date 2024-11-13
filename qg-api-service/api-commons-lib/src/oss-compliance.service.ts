import { Injectable, NotFoundException } from '@nestjs/common'
import { readFile } from 'fs/promises'
import * as path from 'path'

@Injectable()
export class OSSComplianceConfig {
  constructor(
    readonly sbomFilepath: string,
    readonly sourceNameToFileMap: { [name: string]: string } = {},
  ) {}
}

// Service to load the SBOM file from the configured path.
@Injectable()
export class OSSComplianceService {
  constructor(private readonly config: OSSComplianceConfig) {}

  async getSBOM(): Promise<Buffer> {
    return readFile(this.config.sbomFilepath)
  }

  getSBOMFilename(): string {
    return path.basename(this.config.sbomFilepath)
  }

  getComponentsWithSources(): string[] {
    return Object.keys(this.config.sourceNameToFileMap)
  }

  async getSourceForComponent(
    name: string,
  ): Promise<{ filename: string; content: Buffer }> {
    if (!Object.keys(this.config.sourceNameToFileMap).includes(name)) {
      throw new NotFoundException(
        `For component ${name}, sources are not available`,
      )
    }
    const filepath = this.config.sourceNameToFileMap[name]
    const filename = path.basename(filepath)
    const content = await readFile(this.config.sourceNameToFileMap[name])
    return { filename, content }
  }
}
