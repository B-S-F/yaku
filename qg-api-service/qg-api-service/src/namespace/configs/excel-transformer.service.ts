import { decodeBufferToUTF8EncodedString } from '@B-S-F/api-commons-lib'
import { BadRequestException, Injectable } from '@nestjs/common'
import * as xlsx from 'node-xlsx'
import * as YAML from 'yaml'
import { ZodError, z } from 'zod'
import { fromZodError } from 'zod-validation-error'
import { Chapter, Questionnaire, Requirement } from './generator.service'

const checker = (value) => {
  return value.startRow <= value.endRow
}

const ConfigSchema = z
  .object({
    sheet: z.string(),
    startRow: z.number().min(1),
    endRow: z.number().min(1),
    columns: z
      .object({
        chapter: z.string(),
        id: z.string(),
        title: z.string(),
        filter: z.string().optional(),
        comment: z.string().optional(),
        text: z.string().optional(),
      })
      .refine(
        (value) =>
          value.comment === undefined ||
          value.text === undefined ||
          value.comment === value.text,
        { message: 'Use only one of the properties "text" or "comment"' }
      ),
  })
  .refine(checker, {
    message: 'Property "startRow" cannot be larger then "endRow"',
  })

export type Config = z.infer<typeof ConfigSchema>

type QuestionnaireItem = {
  chapterId: string
  chapterTitle: string
  requirementId: string
  requirementTitle: string
  requirementText: string | undefined
}

@Injectable()
export class ExcelTransformerService {
  public transformExcelToQuestionnaireData(
    projectName: string,
    excelFile: Buffer,
    configFile: Buffer
  ): Questionnaire {
    const config = this.readConfig(configFile)
    const excelData = this.readExcelFile(excelFile, config.sheet)
    const extractedData = this.extractRelevantInformation(excelData, config)
    const completeData = this.validateAndCompleteData(extractedData)
    return this.createHierarchicalStructure(completeData, projectName)
  }

  private createHierarchicalStructure(
    data: QuestionnaireItem[],
    project: string
  ): Questionnaire {
    const chapters: { [id: string]: Chapter } = {}
    for (const item of data) {
      const req: Requirement = {
        title: item.requirementTitle,
      }
      if (item.requirementText) {
        req.text = item.requirementText
      }
      const chapter: Chapter = chapters[item.chapterId] ?? {
        title: item.chapterTitle,
        requirements: {},
      }
      if (!chapter.title.includes(item.chapterTitle)) {
        chapter.title = `${chapter.title} -- ${item.chapterTitle}`
      }
      chapter.requirements[item.requirementId.replace(/\n+/g, ' ')] = req
      chapters[item.chapterId] = chapter
    }
    return { project, version: '0.1', chapters }
  }

  private validateAndCompleteData(
    data: QuestionnaireItem[]
  ): QuestionnaireItem[] {
    const chapterIdTitleCache: { [id: string]: string } = {}
    const chapterIdLastRequirementIdCache: { [id: string]: number } = {}
    let currentMaxChapterId = 0
    for (const item of data) {
      if (!item.chapterTitle) {
        item.chapterTitle = '<Enter chapter title here>'
      }
      if (!item.requirementTitle) {
        item.requirementTitle = '<Enter requirement title here>'
      }
      if (!item.chapterId) {
        if (item.chapterTitle in chapterIdTitleCache) {
          item.chapterId = chapterIdTitleCache[item.chapterTitle]
        } else {
          currentMaxChapterId++
          item.chapterId = currentMaxChapterId.toString()
          chapterIdTitleCache[item.chapterTitle] = item.chapterId
        }
      } else {
        const chapterId = parseInt(item.chapterId)
        if (chapterId > currentMaxChapterId) {
          currentMaxChapterId = chapterId
        }
      }
      if (!item.requirementId) {
        if (item.chapterId in chapterIdLastRequirementIdCache) {
          item.requirementId = String(
            chapterIdLastRequirementIdCache[item.chapterId] + 1
          )
          chapterIdLastRequirementIdCache[item.chapterId]++
        } else {
          item.requirementId = '1'
          chapterIdLastRequirementIdCache[item.chapterId] = 1
        }
      }
    }
    return data
  }

  private extractRelevantInformation(
    data: any[][],
    config: Config
  ): QuestionnaireItem[] {
    const chapterColumn = this.getIndexOfExcelColumn(config.columns.chapter)
    const idColumn = this.getIndexOfExcelColumn(config.columns.id)
    const titleColumn = this.getIndexOfExcelColumn(config.columns.title)
    const commentColumn = this.getIndexOfExcelColumn(
      config.columns.comment ?? config.columns.text
    )
    const filterColumn = this.getIndexOfExcelColumn(config.columns.filter)

    if (chapterColumn < 0 || idColumn < 0 || titleColumn < 0) {
      throw new BadRequestException(
        'Chapter column, requirement id column and requirement title column have to be defined in config file'
      )
    }

    const startRow = Math.min(config.startRow, data.length)
    const endRow = Math.min(config.endRow, data.length)

    const relevantInformation: QuestionnaireItem[] = []
    for (let rowId = startRow - 1; rowId < endRow; rowId++) {
      const row = data[rowId]
      if (filterColumn < 0 || row[filterColumn]?.toString().trim()) {
        const { chapterId, chapterTitle } = this.extractChapterInformation(
          row[chapterColumn]
        )
        const requirementId = this.cleanString(row[idColumn])
        const requirementTitle = this.cleanString(row[titleColumn])
        const requirementText =
          commentColumn >= 0 ? this.cleanString(row[commentColumn]) : undefined
        relevantInformation.push({
          chapterId,
          chapterTitle,
          requirementId,
          requirementTitle,
          requirementText,
        })
      }
    }
    return relevantInformation
  }

  private extractChapterInformation(chapterData: any): {
    chapterId: string
    chapterTitle: string
  } {
    if (!chapterData) return { chapterId: '', chapterTitle: '' }
    const match = chapterData.match(/^\s*([.\d]+)\s+(.*)$/)
    if (!match) {
      return { chapterId: '', chapterTitle: this.cleanString(chapterData) }
    }
    const [, id, title] = match
    return {
      chapterId: this.cleanString(id),
      chapterTitle: this.cleanString(title),
    }
  }

  private cleanString(stringData: any): string {
    if (!stringData) return stringData
    return stringData
      .toString()
      .trim()
      .replaceAll('\r\n', '\n')
      .replace(/\\x([0-9a-f]{2})/gi, '\\u00$1')
  }

  private getIndexOfExcelColumn(columnString: string): number {
    const matcher = /^[A-Z]+$/

    const cleanedString = columnString?.trim().toUpperCase()
    if (!cleanedString || !matcher.test(cleanedString)) {
      return -1
    }
    let result = 0
    for (const element of cleanedString) {
      result = result * 26 + (element.charCodeAt(0) - 64)
    }
    return result - 1
  }

  private readExcelFile(excelfile: Buffer, sheetName: string): any[][] {
    const msOfficeSignature = [80, 75, 3, 4]
    try {
      const signature: Uint8Array = excelfile.subarray(0, 4)

      if (
        !msOfficeSignature.every((byte, index) => {
          return byte === signature[index]
        })
      ) {
        throw new Error('Sent xlsx file is not an excel file')
      }
      const workbook = xlsx.parse(excelfile)
      for (const sheet of workbook) {
        if (sheet.name === sheetName) {
          return sheet.data
        }
      }
    } catch (err) {
      throw new BadRequestException(
        `Error during excel file parsing: ${err.message}`
      )
    }
    throw new BadRequestException(
      `Excel file does not contain sheet ${sheetName}`
    )
  }

  private readConfig(configFile: Buffer): Config {
    try {
      const configData = YAML.parse(decodeBufferToUTF8EncodedString(configFile))
      return ConfigSchema.parse(configData)
    } catch (err) {
      const errorMessage =
        err instanceof ZodError ? fromZodError(err) : err.message
      throw new BadRequestException(
        `Could not parse config data, error was ${errorMessage}`
      )
    }
  }
}
