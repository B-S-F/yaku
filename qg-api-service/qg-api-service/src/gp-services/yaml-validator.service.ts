import { BadRequestException, Injectable } from '@nestjs/common'
import * as YAML from 'yaml'

@Injectable()
export class YamlValidatorService {
  async validate(file: Express.Multer.File, filename: string): Promise<string> {
    const fileData: string = file.buffer.toString('utf-8')
    const parsableFile = this.checkCouldBeParsedByYamlParser(fileData)
    const isJsonFile = this.checkIsAJsonFile(fileData)

    if (!parsableFile || isJsonFile) {
      throw new BadRequestException(
        `No valid yaml content for file ${filename}`
      )
    }
    return parsableFile
  }

  checkCouldBeParsedByYamlParser(fileData: string): boolean | any {
    let yamlObject
    try {
      yamlObject = YAML.parse(fileData, { strict: true })
      if (typeof yamlObject != 'object') {
        return false
      }
    } catch (e) {
      return false
    }
    return yamlObject
  }

  checkIsAJsonFile(fileData: string): boolean {
    try {
      JSON.parse(fileData)
      return true
    } catch (e) {
      return false
    }
  }
}
