import { Inject, Injectable } from '@nestjs/common'
import * as YAML from 'yaml'
import { YamlValidatorService } from './yaml-validator.service'
import { ResultSchemaV1, ResultSchemaV2 } from './qg-result-schema'
import { z } from 'zod'
import { fromZodError } from 'zod-validation-error'

@Injectable()
export class ResultValidatorService {
  constructor(
    @Inject(YamlValidatorService)
    private readonly yamlValidator: YamlValidatorService,
  ) {}

  /**
   * Validates a qg-result file (File object or string format). Throws an error if qg-result file is invalid.
   * @param file The qg-result that is validated. Accepts File object or string.
   * @param [filename] Name of the qg-result file (optional).
   */
  async validate(
    file: Express.Multer.File | string,
    filename = 'qg-result',
  ): Promise<void> {
    let fileData
    if (typeof file == 'string') {
      try {
        fileData = YAML.parse(file)
      } catch {
        throw new Error(`Could not parse string.`)
      }
    } else {
      fileData = await this.yamlValidator.validate(file, filename)
    }

    const version = fileData.metadata?.version
    if (!version) {
      throw new Error(
        `Could not find version for ${filename}. Valid versions: v1 or v2.`,
      )
    }

    let resultSchema
    switch (version) {
      case 'v1':
        resultSchema = ResultSchemaV1
        break
      case 'v2':
        resultSchema = ResultSchemaV2
        break
      default:
        throw new Error(
          `Invalid version for ${filename}. Valid versions: v1 or v2.`,
        )
    }

    try {
      resultSchema.parse(fileData)
    } catch (err) {
      if (err instanceof z.ZodError) {
        throw new Error(
          `Validation failed for ${filename}. ${fromZodError(err).message}.`,
        )
      }
    }
  }
}
