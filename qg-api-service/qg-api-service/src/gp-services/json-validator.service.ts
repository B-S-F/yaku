import { BadRequestException, Injectable } from '@nestjs/common'

@Injectable()
export class JsonValidatorService {
  async validate(file: Express.Multer.File, filename: string): Promise<void> {
    const fileString: string = file.buffer.toString()
    try {
      JSON.parse(fileString)
    } catch {
      throw new BadRequestException(
        `Incorrect file type or format of file: ${filename}. Json was expected.`
      )
    }
  }
}
