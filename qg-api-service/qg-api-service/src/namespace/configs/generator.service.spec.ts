import { BadRequestException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { readFileSync } from 'fs'
import * as YAML from 'yaml'
import { GeneratorService } from './generator.service'

const questionnaire = Buffer.from(`
project: Test Project
version: '1.0'
chapters:
  '1':
    title: Project Management
    requirements:
      '1':
        title: Product development and resources formally approved, responsible person named
        text: Project Charter and - if required - Project Management Plan have been released
        checks:
          '1':
            title: Check docupedia page - Relevant page https://example.com/confluence/...
      '2':
        title: Product development schedule has been updated and is met
        text: |-
          Time schedule was coordinated with all parties involved.
          The target dates are up to date and can be realized.
          Interactions with schedules for the system or components are taken into account.
          
          Customer milestones were considered.
        checks:
          '1':
            title: Check Agile Roadmap - Relevant file https://example.com/sites/123456/Documents/...
          '2':
            title: Check Vision - Relevant file https://example.com/sites/123456/Documents/...
      '3':
        title: The revenue and cost targets are achievable (also for subprojects and components)
        text: An updated profitability calculation is available and has been confirmed
        checks:
          '1':
            title: Check Long term planning - Relevant file https://example.com/sites/123456/Documents/...
          '2':
            title: Check Standard Pricing - Relevant file https://example.com//sites/123456/Documents/...
  '2':
    title: Requirements Management,
    requirements:
      '1':
        title: The current 'State of the Art' in the market is assessed and taken into account in relation to product liability
`)

const expectedResult = `
metadata:
  version: 'v1'
header:
  name: Test Project
  version: '1.0'
env:
  GLOBAL_VARIABLE: Some globally defined value
autopilots:
  templatePilot:
    run: |
      echo '{"status": "GREEN"}'
      echo '{"reason": "Evaluated successful because ..."}'
      echo '{"result": { "criterion": "Autopilot Check Criterion", "fulfilled": true, "justification": "Criterion fulfilled because ..."}}'
      echo '{"output": {"file output": "filename.txt"}}'
    config:
      - config-filename.yaml
    env:
      AUTOPILOT_VARIABLE: \${ env.GLOBAL_VARIABLE } used in the autopilot context
finalize:
  run: |
    echo 'Post process results here'
  env:
    FINALIZER_VARIABLE: \${ env.GLOBAL_VARIABLE } used in the finalizer context
chapters:
  '1':
    title: Project Management
    requirements:
      '1':
        title: Product development and resources formally approved, responsible person named
        text: Project Charter and - if required - Project Management Plan have been released
        checks:
          '1':
            title: Check docupedia page - Relevant page https://example.com/confluence/...
            manual:
              status: UNANSWERED
              reason: Initial implementation of the check
      '2':
        title: Product development schedule has been updated and is met
        text: >-
          Time schedule was coordinated with all parties involved. The target
          dates are up to date and can be realized. Interactions with schedules
          for the system or components are taken into account.
          
          Customer milestones were considered.
        checks:
          '1':
            title: Check Agile Roadmap - Relevant file https://example.com/sites/123456/Documents/...
            manual:
              status: UNANSWERED
              reason: Initial implementation of the check
          '2':
            title: Check Vision - Relevant file https://example.com/sites/123456/Documents/...
            manual:
              status: UNANSWERED
              reason: Initial implementation of the check
      '3':
        title: The revenue and cost targets are achievable (also for subprojects and components)
        text: An updated profitability calculation is available and has been confirmed
        checks:
          '1':
            title: Check Long term planning - Relevant file https://example.com/sites/123456/Documents/...
            manual:
              status: UNANSWERED
              reason: Initial implementation of the check
          '2':
            title: Check Standard Pricing - Relevant file https://example.com//sites/123456/Documents/...
            manual:
              status: UNANSWERED
              reason: Initial implementation of the check
  '2':
    title: Requirements Management,
    requirements:
      '1':
        title: The current 'State of the Art' in the market is assessed and taken into account in relation to product liability
        checks:
          '1':
            title: Generated Check
            manual:
              status: UNANSWERED
              reason: Initial implementation of the check
`

describe('GeneratorService', () => {
  let service: GeneratorService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GeneratorService],
    }).compile()

    service = module.get<GeneratorService>(GeneratorService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('Generate config file', () => {
    it('should generate a config as expected, test with input data having all necessary features in place', () => {
      const result = service.generateInitialConfig(questionnaire)

      expect(result).toBeDefined()
      const expected = YAML.parse(expectedResult)
      const received = YAML.parse(result)
      expect(received).toEqual(expected)
    })

    it('should catch empty input', () => {
      expect(() => service.generateInitialConfig(undefined)).toThrow(
        BadRequestException
      )
      expect(() => service.generateInitialConfig(undefined)).toThrow(
        'No questionnaire data given'
      )
    })

    it('should catch unparsable input', () => {
      const unparsable = Buffer.from(`
project: Test Project
version: '1.0'
chapters:
  '1':
    title: Chapter 1
     requirements:
      '1':
        title: Requirement 1
`)
      expect(() => service.generateInitialConfig(unparsable)).toThrow(
        BadRequestException
      )
      expect(() => service.generateInitialConfig(unparsable)).toThrow(
        'Could not parse the questionnaire data, error was Nested mappings are not allowed'
      )
    })

    it('should catch wrong file format, e.g., xlsx', () => {
      const unparsable = readFileSync(
        `${__dirname}/testdata/SampleProject.xlsx.config`
      )
      expect(() => service.generateInitialConfig(unparsable)).toThrow(
        BadRequestException
      )
      expect(() => service.generateInitialConfig(unparsable)).toThrow(
        'Could not parse the questionnaire data, error was Validation error: Required at "chapters"'
      )
    })

    it('should replace not existing project and version tags', () => {
      const noProjectAndVersion = Buffer.from(`
chapters:
  '1':
    title: Project Management
    requirements:
      '1':
        title: Product development and resources formally approved, responsible person named
`)

      const result = service.generateInitialConfig(noProjectAndVersion)

      expect(result).toBeDefined()
      const received = YAML.parse(result)
      expect(received.header.name).toBe('<Enter project name>')
      expect(received.header.version).toBe('<Enter project version>')
    })

    it('should catch questionnaire without chapters', () => {
      const noChapters = Buffer.from(`
project: Test Project
version: '1.0'
`)
      expect(() => service.generateInitialConfig(noChapters)).toThrow(
        BadRequestException
      )
      expect(() => service.generateInitialConfig(noChapters)).toThrow(
        'Could not parse the questionnaire data, error was Validation error: Required at "chapters"'
      )
    })

    it('should catch empty chapters tag', () => {
      const noChapters = Buffer.from(`
project: Test Project
version: '1.0'
chapters:
`)
      expect(() => service.generateInitialConfig(noChapters)).toThrow(
        BadRequestException
      )
      expect(() => service.generateInitialConfig(noChapters)).toThrow(
        'Could not parse the questionnaire data, error was Validation error: Expected object, received null at "chapters"'
      )
    })

    it('should catch chapters without title', () => {
      const noChapterTitle = Buffer.from(`
project: Test Project
version: '1.0'
chapters:
  '1':
    requirements:
      '1':
        title: Requirement 1
`)

      expect(() => service.generateInitialConfig(noChapterTitle)).toThrow(
        BadRequestException
      )
      expect(() => service.generateInitialConfig(noChapterTitle)).toThrow(
        'Could not parse the questionnaire data, error was Validation error: Required at "chapters["1"].title"'
      )
    })

    it('should catch chapters without requirements', () => {
      const noRequirements = Buffer.from(`
project: Test Project
version: '1.0'
chapters:
  '1':
    title: Chapter 1
  '2':
    title: Chapter 2
    requirements:
      '1':
        title: Requirement 2.1
`)

      expect(() => service.generateInitialConfig(noRequirements)).toThrow(
        BadRequestException
      )
      expect(() => service.generateInitialConfig(noRequirements)).toThrow(
        'Could not parse the questionnaire data, error was Validation error: Required at "chapters["1"].requirements"'
      )
    })

    it('should catch chapters with empty requirements tag', () => {
      const noRequirements = Buffer.from(`
project: Test Project
version: '1.0'
chapters:
  '1':
    title: Chapter 1
  '2':
    title: Chapter 2
    requirements:
      '1':
        title: Requirement 2.1
        requirements:
`)

      expect(() => service.generateInitialConfig(noRequirements)).toThrow(
        BadRequestException
      )
      expect(() => service.generateInitialConfig(noRequirements)).toThrow(
        'Could not parse the questionnaire data, error was Validation error: Required at "chapters["1"].requirements"'
      )
    })

    it('should catch requirements without title', () => {
      const noRequirementTitle = Buffer.from(`
project: Test Project
version: '1.0'
chapters:
  '1':
    title: Chapter 1
    requirements:
      '1':
        text: Some description
`)

      expect(() => service.generateInitialConfig(noRequirementTitle)).toThrow(
        BadRequestException
      )
      expect(() => service.generateInitialConfig(noRequirementTitle)).toThrow(
        'Could not parse the questionnaire data, error was Validation error: Required at "chapters["1"].requirements["1"].title"'
      )
    })
  })
})
