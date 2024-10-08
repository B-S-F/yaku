import { BadRequestException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { readFileSync } from 'fs'
import { readFile } from 'fs/promises'
import * as YAML from 'yaml'
import { Config, ExcelTransformerService } from './excel-transformer.service'
import { Questionnaire } from './generator.service'

describe('ExcelTransformerService', () => {
  let service: ExcelTransformerService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExcelTransformerService],
    }).compile()

    service = module.get<ExcelTransformerService>(ExcelTransformerService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('Relevant information extractor', () => {
    const testData: string[][] = [
      ['1', '1 Chapter1', '1', 'x', 'Requirement1', 'id 1', 'Comment 1', '1'],
      ['1', '1 Chapter1', '1', 'x', 'Requirement2', 'id 2', 'Comment 2', '1'],
      ['1', '2 Chapter2', '1', ' ', 'Requirement3', 'id 3', 'Comment 3', '1'],
      ['1', '2 Chapter2', '1', 'x', 'Requirement4', 'id 4', 'Comment 4', '1'],
    ]

    const config1 = {
      sheet: 'Table1',
      startRow: 1,
      endRow: 4,
      columns: {
        chapter: 'B',
        id: 'F',
        title: 'E',
        comment: 'G',
        filter: 'D',
      },
    }

    const config2 = {
      sheet: 'Table1',
      startRow: 1,
      endRow: 4,
      columns: {
        chapter: 'B',
        id: 'F',
        title: 'E',
      },
    }

    const row1 = {
      chapterId: '1',
      chapterTitle: 'Chapter1',
      requirementId: 'id 1',
      requirementTitle: 'Requirement1',
      requirementText: 'Comment 1',
    }
    const row2 = {
      chapterId: '1',
      chapterTitle: 'Chapter1',
      requirementId: 'id 2',
      requirementTitle: 'Requirement2',
      requirementText: 'Comment 2',
    }
    const row3 = {
      chapterId: '2',
      chapterTitle: 'Chapter2',
      requirementId: 'id 3',
      requirementTitle: 'Requirement3',
      requirementText: 'Comment 3',
    }
    const row4 = {
      chapterId: '2',
      chapterTitle: 'Chapter2',
      requirementId: 'id 4',
      requirementTitle: 'Requirement4',
      requirementText: 'Comment 4',
    }

    it('should process data with filter and comment', () => {
      const result = service['extractRelevantInformation'](testData, config1)

      expect(result.length).toBe(3)
      expect(result[0]).toEqual(row1)
      expect(result[1]).toEqual(row2)
      expect(result[2]).toEqual(row4)
    })

    it('should set indices to data.length if too high', () => {
      const cfg = {
        sheet: config2.sheet,
        startRow: 5,
        endRow: 7,
        columns: { ...config1.columns },
      }

      const result = service['extractRelevantInformation'](testData, cfg)
      expect(result.length).toBe(1)
      expect(result[0]).toEqual(row4)
    })

    it('should set end row index to data.length', () => {
      const cfg = {
        sheet: config2.sheet,
        startRow: 2,
        endRow: 7,
        columns: { ...config1.columns },
      }

      const result = service['extractRelevantInformation'](testData, cfg)
      expect(result.length).toBe(2)
      expect(result[0]).toEqual(row2)
      expect(result[1]).toEqual(row4)
    })

    it('should process data without filter and without comment information', () => {
      const result = service['extractRelevantInformation'](testData, config2)

      const reduceRow = (row: any) => {
        const { requirementText, ...expected } = row
        return expected
      }

      expect(result.length).toBe(4)
      expect(result[0]).toEqual(reduceRow(row1))
      expect(result[1]).toEqual(reduceRow(row2))
      expect(result[2]).toEqual(reduceRow(row3))
      expect(result[3]).toEqual(reduceRow(row4))
    })

    it.each(['chapter', 'id', 'title'])(
      'should catch wrong column indices',
      (column: string) => {
        const cfg = {
          sheet: config2.sheet,
          startRow: config2.startRow,
          endRow: config2.endRow,
          columns: {
            ...config2.columns,
            column: '123',
          },
        }
        cfg.columns[column] = '123'

        expect(() =>
          service['extractRelevantInformation'](testData, cfg)
        ).toThrow(
          'Chapter column, requirement id column and requirement title column have to be defined in config file'
        )
      }
    )
  })

  describe('Data validation and completion', () => {
    it.each([
      [
        'No issue item',
        {
          chapterId: '1',
          chapterTitle: 'Chapter',
          requirementId: 'id 1',
          requirementTitle: 'RequirementTitle',
          requirementText: 'Comment',
        },
        {
          chapterId: '1',
          chapterTitle: 'Chapter',
          requirementId: 'id 1',
          requirementTitle: 'RequirementTitle',
          requirementText: 'Comment',
        },
      ],
      [
        'No issue item without comment',
        {
          chapterId: '1',
          chapterTitle: 'Chapter',
          requirementId: 'id 1',
          requirementTitle: 'RequirementTitle',
          requirementText: undefined,
        },
        {
          chapterId: '1',
          chapterTitle: 'Chapter',
          requirementId: 'id 1',
          requirementTitle: 'RequirementTitle',
          requirementText: undefined,
        },
      ],
      [
        'No chapter title',
        {
          chapterId: '1',
          chapterTitle: '',
          requirementId: 'id 1',
          requirementTitle: 'RequirementTitle',
          requirementText: undefined,
        },
        {
          chapterId: '1',
          chapterTitle: '<Enter chapter title here>',
          requirementId: 'id 1',
          requirementTitle: 'RequirementTitle',
          requirementText: undefined,
        },
      ],
      [
        'No chapter id',
        {
          chapterId: '',
          chapterTitle: 'Chapter',
          requirementId: 'id 1',
          requirementTitle: 'RequirementTitle',
          requirementText: undefined,
        },
        {
          chapterId: '1',
          chapterTitle: 'Chapter',
          requirementId: 'id 1',
          requirementTitle: 'RequirementTitle',
          requirementText: undefined,
        },
      ],
      [
        'No requirement title',
        {
          chapterId: '1',
          chapterTitle: 'Chapter',
          requirementId: 'id 1',
          requirementTitle: '',
          requirementText: undefined,
        },
        {
          chapterId: '1',
          chapterTitle: 'Chapter',
          requirementId: 'id 1',
          requirementTitle: '<Enter requirement title here>',
          requirementText: undefined,
        },
      ],
      [
        'No requirement id',
        {
          chapterId: '1',
          chapterTitle: 'Chapter',
          requirementId: '',
          requirementTitle: 'RequirementTitle',
          requirementText: undefined,
        },
        {
          chapterId: '1',
          chapterTitle: 'Chapter',
          requirementId: '1',
          requirementTitle: 'RequirementTitle',
          requirementText: undefined,
        },
      ],
    ])('should complete case %s', (name: string, input, expected) => {
      const result = service['validateAndCompleteData']([input])
      expected.requirementId = result[0].requirementId
      expect(result[0]).toEqual(expected)
    })

    it('should create chapter ids based on the highest id found', () => {
      const testdata = [
        {
          chapterId: '3',
          chapterTitle: 'Chapter x',
          requirementId: 'id 1',
          requirementTitle: 'RequirementTitle',
          requirementText: 'Comment',
        },
        {
          chapterId: '',
          chapterTitle: 'Chapter y',
          requirementId: 'id 1',
          requirementTitle: 'RequirementTitle',
          requirementText: 'Comment',
        },
      ]

      const result = service['validateAndCompleteData'](testdata)

      expect(result[0].chapterId).toBe('3')
      expect(result[1].chapterId).toBe('4')
    })
  })

  describe('Create the hierarchical structure of chapters', () => {
    it('should transform the list of requirements into a hierarchical structure of chapters', () => {
      const testdata = [
        {
          chapterId: '1',
          chapterTitle: 'Chapter 1',
          requirementId: 'id 1',
          requirementTitle: 'Requirement 1.1',
          requirementText: 'Comment 1.1',
        },
        {
          chapterId: '2',
          chapterTitle: 'Chapter 2',
          requirementId: 'id 1',
          requirementTitle: 'Requirement 2.1',
          requirementText: undefined,
        },
        {
          chapterId: '1',
          chapterTitle: 'Chapter 1',
          requirementId: 'id 2',
          requirementTitle: 'Requirement 1.2',
          requirementText: undefined,
        },
        {
          chapterId: '3',
          chapterTitle: 'Chapter 3',
          requirementId: 'id 1',
          requirementTitle: 'Requirement 3.1',
          requirementText: 'Comment 3.1',
        },
        {
          chapterId: '1',
          chapterTitle: 'Chapter1',
          requirementId: 'id 3',
          requirementTitle: 'Requirement 1.3',
          requirementText: undefined,
        },
        {
          chapterId: '2',
          chapterTitle: 'Chapter 2',
          requirementId: 'id 2',
          requirementTitle: 'Requirement 2.2',
          requirementText: undefined,
        },
      ]
      const project = 'project_xyz'

      const expected: Questionnaire = {
        project: project,
        version: '0.1',
        chapters: {
          '1': {
            title: 'Chapter 1 -- Chapter1',
            requirements: {
              'id 1': {
                title: testdata[0].requirementTitle,
                text: testdata[0].requirementText,
              },
              'id 2': {
                title: testdata[2].requirementTitle,
              },
              'id 3': {
                title: testdata[4].requirementTitle,
              },
            },
          },
          '2': {
            title: testdata[1].chapterTitle,
            requirements: {
              'id 1': {
                title: testdata[1].requirementTitle,
              },
              'id 2': {
                title: testdata[5].requirementTitle,
              },
            },
          },
          '3': {
            title: testdata[3].chapterTitle,
            requirements: {
              'id 1': {
                title: testdata[3].requirementTitle,
                text: testdata[3].requirementText,
              },
            },
          },
        },
      }

      expect(service['createHierarchicalStructure'](testdata, project)).toEqual(
        expected
      )
    })

    it('should replace line breaks with spaces in requirement IDs', () => {
      const testdata = [
        {
          chapterId: '1',
          chapterTitle: 'Chapter 1',
          requirementId: 'TEST\n\n\nREQ 1',
          requirementTitle: 'Requirement 1.1',
          requirementText: 'Comment 1.1',
        },
      ]
      const project = 'project_xyz'

      const expected: Questionnaire = {
        project: project,
        version: '0.1',
        chapters: {
          '1': {
            title: 'Chapter 1',
            requirements: {
              'TEST REQ 1': {
                title: testdata[0].requirementTitle,
                text: testdata[0].requirementText,
              },
            },
          },
        },
      }

      expect(service['createHierarchicalStructure'](testdata, project)).toEqual(
        expected
      )
    })
  })

  describe('Extract chapter information from excel cell', () => {
    it.each([
      ['1 Chapter', '1', 'Chapter'],
      [' 1 2 Chapter', '1', '2 Chapter'],
      ['  5 Some strange text   ', '5', 'Some strange text'],
      ['Chapter', '', 'Chapter'],
      ['  Chapter 5 ', '', 'Chapter 5'],
    ])('should parse correctly %s', (input, chapterId, chapterTitle) => {
      expect(service['extractChapterInformation'](input)).toEqual({
        chapterId,
        chapterTitle,
      })
    })
  })
  describe('Clean up strings received from excel', () => {
    it.each([
      [undefined, undefined],
      [null, null],
      ['', ''],
      ['normal string', 'normal string'],
      ['normal\r\nstring', 'normal\nstring'],
      ['normal\nstring"', 'normal\nstring"'],
      ['\\xf4', '\\u00f4'],
    ])('should escape string %s', (input, expected: string) => {
      const output = service['cleanString'](input)
      expect(output).toEqual(expected)
    })
  })

  describe('Excel column conversion', () => {
    it.each([
      ['A', 0],
      ['Z', 25],
      ['aa', 26],
      ['LZ', 337],
      ['AAA', 702],
      [' Z ', 25],
    ])(
      'should convert the excel column letters to a zero based index for %s',
      (letters: string, result: number) => {
        expect(service['getIndexOfExcelColumn'](letters)).toBe(result)
      }
    )

    it.each([undefined, null, '', '1', '$', '&', 'A34'])(
      'should return -1 for incorrect column indices',
      (input) => {
        expect(service['getIndexOfExcelColumn'](input)).toBe(-1)
      }
    )
  })

  describe('Read Excel File', () => {
    it('should read an excel file and return the right sheet', async () => {
      const excelFile = await readFile(
        `${__dirname}/testdata/SampleProject.xlsx`
      )

      expect(
        service['readExcelFile'](excelFile, 'Sample Criteria')
      ).toBeDefined()
    })

    it('should throw an exception if sheet not to be found', async () => {
      const excelFile = await readFile(
        `${__dirname}/testdata/SampleProject.xlsx`
      )

      expect(() =>
        service['readExcelFile'](excelFile, 'SampleProject2')
      ).toThrow(BadRequestException)
      expect(() =>
        service['readExcelFile'](excelFile, 'SampleProject2')
      ).toThrow('Excel file does not contain sheet SampleProject2')
    })

    it.each([
      undefined,
      null,
      Buffer.from(''),
      Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]),
      readFileSync(`${__dirname}/testdata/SampleProject.xlsx.config`),
    ])('should throw an exception if excel file is corrupt', (input) => {
      expect(() => service['readExcelFile'](input, 'SampleProject')).toThrow(
        BadRequestException
      )
    })
  })

  describe('Read configs', () => {
    it.each([
      [
        'all features',
        {
          sheet: 'MySheet',
          startRow: 2,
          endRow: 100,
          columns: {
            chapter: 'A',
            id: 'B',
            title: 'D',
            filter: 'G',
            comment: 'K',
          },
        },
      ],
      [
        'all features with alternative',
        {
          sheet: 'MySheet',
          startRow: 2,
          endRow: 100,
          columns: {
            chapter: 'A',
            id: 'B',
            title: 'D',
            filter: 'G',
            text: 'K',
          },
        },
      ],
      [
        'minimal features',
        {
          sheet: 'MySheet',
          startRow: 2,
          endRow: 100,
          columns: {
            chapter: 'A',
            id: 'B',
            title: 'D',
          },
        },
      ],
      [
        'all features except filter',
        {
          sheet: 'MySheet',
          startRow: 2,
          endRow: 100,
          columns: {
            chapter: 'A',
            id: 'B',
            title: 'D',
            comment: 'K',
          },
        },
      ],
      [
        'both comment and text with same value',
        {
          sheet: 'MySheet',
          startRow: 2,
          endRow: 100,
          columns: {
            chapter: 'A',
            id: 'B',
            title: 'D',
            comment: 'K',
            text: 'K',
          },
        },
      ],
    ])('should read config %s', (name: string, config: Config) => {
      const input = Buffer.from(YAML.stringify(config))

      expect(service['readConfig'](input)).toEqual(config)
    })

    it.each([
      [
        'no sheet',
        {
          startRow: 2,
          endRow: 100,
          columns: {
            chapter: 'A',
            id: 'B',
            title: 'D',
          },
        },
        'Could not parse config data, error was Validation error: Required at "sheet"',
      ],
      [
        'no start row',
        {
          sheet: 'MySheet',
          endRow: 100,
          columns: {
            chapter: 'A',
            id: 'B',
            title: 'D',
          },
        },
        'Could not parse config data, error was Validation error: Required at "startRow"',
      ],
      [
        'no end row',
        {
          sheet: 'MySheet',
          startRow: 2,
          columns: {
            chapter: 'A',
            id: 'B',
            title: 'D',
          },
        },
        'Could not parse config data, error was Validation error: Required at "endRow"',
      ],
      [
        'startRow = 0',
        {
          sheet: 'MySheet',
          startRow: 0,
          endRow: 2,
          columns: {
            chapter: 'A',
            id: 'B',
            title: 'D',
          },
        },
        'Could not parse config data, error was Validation error: Number must be greater than or equal to 1 at "startRow"',
      ],
      [
        'endRow = 0',
        {
          sheet: 'MySheet',
          startRow: 1,
          endRow: 0,
          columns: {
            chapter: 'A',
            id: 'B',
            title: 'D',
          },
        },
        'Could not parse config data, error was Validation error: Number must be greater than or equal to 1 at "endRow"; Property "startRow" cannot be larger then "endRow"',
      ],
      [
        'startRow > endRow',
        {
          sheet: 'MySheet',
          startRow: 3,
          endRow: 2,
          columns: {
            chapter: 'A',
            id: 'B',
            title: 'D',
          },
        },
        'Could not parse config data, error was Validation error: Property "startRow" cannot be larger then "endRow"',
      ],
      [
        'no chapter',
        {
          sheet: 'MySheet',
          startRow: 2,
          endRow: 100,
          columns: {
            id: 'B',
            title: 'D',
          },
        },
        'Could not parse config data, error was Validation error: Required at "columns.chapter"',
      ],
      [
        'no id',
        {
          sheet: 'MySheet',
          startRow: 2,
          endRow: 100,
          columns: {
            chapter: 'A',
            title: 'D',
          },
        },
        'Could not parse config data, error was Validation error: Required at "columns.id"',
      ],
      [
        'no title',
        {
          sheet: 'MySheet',
          startRow: 2,
          endRow: 100,
          columns: {
            chapter: 'A',
            id: 'B',
          },
        },
        'Could not parse config data, error was Validation error: Required at "columns.title"',
      ],
      [
        'text and comment',
        {
          sheet: 'MySheet',
          startRow: 2,
          endRow: 100,
          columns: {
            chapter: 'A',
            id: 'B',
            title: 'D',
            text: 'K',
            comment: 'L',
          },
        },
        'Could not parse config data, error was Validation error: Use only one of the properties "text" or "comment" at "columns"',
      ],
    ])(
      'should throw exception for inconsistent config %s',
      (name: string, config: Config, message: string) => {
        const input = Buffer.from(YAML.stringify(config))

        expect(() => service['readConfig'](input)).toThrow(BadRequestException)
        expect(() => service['readConfig'](input)).toThrow(message)
      }
    )

    it('should indicate non yaml format with an exception', () => {
      const input = Buffer.from(`
sheet:
startRow 2
 endRow 100
`)

      expect(() => service['readConfig'](input)).toThrow(BadRequestException)
      expect(() => service['readConfig'](input)).toThrow(
        'Could not parse config data, error was Implicit keys need to be on a single line'
      )
    })

    it.each([undefined, null, Buffer.from('')])(
      'should catch empty input',
      (input) => {
        expect(() => service['readConfig'](input)).toThrow(BadRequestException)
      }
    )
  })

  describe('Whole service test', () => {
    it('should process an excel file with filtered input', async () => {
      const excelFile = await readFile(
        `${__dirname}/testdata/SampleProject.xlsx`
      )
      const configFile = await readFile(
        `${__dirname}/testdata/SampleProject.xlsx_filtered.config`
      )

      const expectedFiltered: Questionnaire = {
        project: 'SampleProject',
        version: '0.1',
        chapters: {
          '1': {
            title: 'Requirement Management',
            requirements: {
              '1.1': {
                title: 'Requirement 1.1',
                text: 'Comment 1.1',
              },
            },
          },
          '2': {
            title: 'Project Management',
            requirements: {
              '2.1': {
                title: 'Requirement 2.1',
                text: 'Comment 2.1',
              },
              '2.2': {
                title: 'Requirement 2.2',
                text: 'Comment 2.2',
              },
            },
          },
          '3': {
            title: 'Quality',
            requirements: {
              '3.1': {
                title: 'Requirement 3.1',
                text: 'Comment 3.1',
              },
              '3.3': {
                title: 'Requirement 3.3',
                text: 'Comment 3.3',
              },
            },
          },
        },
      }

      expect(
        service.transformExcelToQuestionnaireData(
          'SampleProject',
          excelFile,
          configFile
        )
      ).toEqual(expectedFiltered)
    })

    it('should process an excel file with unfiltered input', async () => {
      const excelFile = await readFile(
        `${__dirname}/testdata/SampleProject.xlsx`
      )
      const configFile = await readFile(
        `${__dirname}/testdata/SampleProject.xlsx.config`
      )

      const expectedFiltered: Questionnaire = {
        project: 'SampleProject',
        version: '0.1',
        chapters: {
          '1': {
            title: 'Requirement Management',
            requirements: {
              '1.1': {
                title: 'Requirement 1.1',
                text: 'Comment 1.1',
              },
              '1.2': {
                title: 'Requirement 1.2',
                text: 'Comment 1.2',
              },
            },
          },
          '2': {
            title: 'Project Management',
            requirements: {
              '2.1': {
                title: 'Requirement 2.1',
                text: 'Comment 2.1',
              },
              '2.2': {
                title: 'Requirement 2.2',
                text: 'Comment 2.2',
              },
            },
          },
          '3': {
            title: 'Quality',
            requirements: {
              '3.1': {
                title: 'Requirement 3.1',
                text: 'Comment 3.1',
              },
              '3.2': {
                title: 'Requirement 3.2',
                text: 'Comment 3.2',
              },
              '3.3': {
                title: 'Requirement 3.3',
                text: 'Comment 3.3',
              },
            },
          },
        },
      }

      expect(
        service.transformExcelToQuestionnaireData(
          'SampleProject',
          excelFile,
          configFile
        )
      ).toEqual(expectedFiltered)
    })

    it('should process a customer file', async () => {
      const excelFile = await readFile(
        `${__dirname}/testdata/QG-Checklist-SW-Component_1.4.xlsx`
      )
      const configFile = await readFile(
        `${__dirname}/testdata/QG-Checklist-SW-Component_1.4.xlsxconfig.yaml`
      )

      const result = service.transformExcelToQuestionnaireData(
        'BCI',
        excelFile,
        configFile
      )

      expect(Object.keys(result.chapters).length).toBe(10)
      expect(Object.keys(result.chapters)).toEqual([
        '1',
        '2',
        '3',
        '4',
        '5',
        '10',
        '12',
        '13',
        '15',
        '17',
      ])

      const reqCount = Object.keys(result.chapters)
        .map((key) => result.chapters[key])
        .map((chap) => Object.keys(chap.requirements).length)
        .reduce((acc, reqLength) => acc + reqLength)

      expect(reqCount).toBe(45)
    })
  })
})
