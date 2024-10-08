import { BadRequestException, Injectable } from '@nestjs/common'
import * as YAML from 'yaml'

@Injectable()
export class YamlValidatorService {
  async validate(file: Express.Multer.File, filename: string): Promise<void> {
    const fileData: string = file.buffer.toString('utf-8')
    if (
      !this.checkCouldBeParsedByYamlParser(fileData) ||
      !this.checkIsNotAJsonFile(fileData)
    ) {
      throw new BadRequestException(
        `No valid yaml content for file ${filename}`
      )
    }
  }

  checkCouldBeParsedByYamlParser(fileData: string): boolean {
    try {
      const yamlObject = YAML.parse(fileData, { strict: true })
      if (typeof yamlObject != 'object') {
        return false
      }
    } catch (e) {
      return false
    }
    return true
  }

  checkIsNotAJsonFile(fileData: string): boolean {
    try {
      JSON.parse(fileData)
      return false
    } catch (e) {
      return true
    }
  }
}
