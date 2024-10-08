import { BadRequestException } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import * as fs from 'fs'
import { YamlValidatorService } from './yaml-validator.service'

describe('YamlValidatorService', () => {
  let yamlValidator: YamlValidatorService
  const validFiles: string[] = ['test.txt', 'test.yaml']

  const invalidFiles: string[] = [
    'test.docx',
    'test.jpg',
    'test_incorrect_format.txt',
    'test.json',
  ]

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [YamlValidatorService],
    }).compile()

    yamlValidator = moduleRef.get<YamlValidatorService>(YamlValidatorService)
  })

  it('should be defined', () => {
    expect(yamlValidator).toBeDefined()
  })

  test.each(validFiles)(
    'run yaml validator with correctly formatted files; expect to throw no error',
    async (file) => {
      const multerFile: Partial<Express.Multer.File> = {
        originalname: file,
        buffer: fs.readFileSync(`${__dirname}/fixtures/${file}`),
      }

      await yamlValidator.validate(multerFile as Express.Multer.File, file)
    }
  )

  test.each(invalidFiles)(
    'run yaml validator with invalid file %s; expect to throw BadRequest',
    async (file) => {
      const multerFile: Partial<Express.Multer.File> = {
        originalname: file,
        buffer: fs.readFileSync(`${__dirname}/fixtures/${file}`),
      }

      await expect(
        yamlValidator.validate(multerFile as Express.Multer.File, file)
      ).rejects.toEqual(
        new BadRequestException(`No valid yaml content for file ${file}`)
      )
    }
  )
})
