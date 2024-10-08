import { BadRequestException } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import * as fs from 'fs'
import { JsonValidatorService } from './json-validator.service'

describe('JsonValidatorService', () => {
  let jsonValidator: JsonValidatorService
  const invalidFiles: string[] = ['xlsx', 'docx', 'jpg', 'txt', 'yaml']

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [JsonValidatorService],
    }).compile()

    jsonValidator = moduleRef.get<JsonValidatorService>(JsonValidatorService)
  })

  it('should be defined', () => {
    expect(jsonValidator).toBeDefined()
  })

  it('run json evaluator with valid file; expect no error to be thrown', async () => {
    const multerFile: Partial<Express.Multer.File> = {
      originalname: 'test.json',
      buffer: fs.readFileSync(`${__dirname}/fixtures/test.json`),
    }

    await jsonValidator.validate(multerFile as Express.Multer.File, 'test.json')
  })

  test.each(invalidFiles)(
    'run json validator with invalid file type %s; expect to throw BadRequest Error',
    async (fileType) => {
      const multerFile: Partial<Express.Multer.File> = {
        originalname: `test.${fileType}`,
        buffer: fs.readFileSync(`${__dirname}/fixtures/test.${fileType}`),
      }

      await expect(
        jsonValidator.validate(
          multerFile as Express.Multer.File,
          `test.${fileType}`
        )
      ).rejects.toEqual(
        new BadRequestException(
          `Incorrect file type or format of file: test.${fileType}. Json was expected.`
        )
      )
    }
  )
})
