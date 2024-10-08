import { CreateFindingDTO } from '../dto/create-finding.dto'
import { Run, FindingQgResult } from './interfaces/qgRunMessageInterfaces'
import { RunOverallStatusType } from './enums/runOverallStatusType.enum'
import { StatusType } from '../utils/enums/statusType.enum'
import { createHash } from 'node:crypto'
import { HashFields } from './interfaces/findingsInterfaces'
import { DataSchema } from './schemas/qgResultSchemas'

import * as yaml from 'js-yaml'
import { Logger } from '@nestjs/common'
import { RunStatus } from '../../run/run.entity'

export function extractFindings(yamlContent: string): FindingQgResult[] {
  const findings: FindingQgResult[] = []

  try {
    const data: any = yaml.load(yamlContent)

    // Validate the loaded data against the schema
    const parsedData = DataSchema.parse(data)

    function traverseChapters(chapters: any, chapterNumber = '') {
      for (const chapterKey in chapters) {
        const chapter = chapters[chapterKey]
        const currentChapterNumber =
          chapterNumber === '' ? chapterKey : `${chapterNumber}.${chapterKey}`

        if (chapter.requirements) {
          traverseRequirements(chapter.requirements, currentChapterNumber)
        }
      }
    }

    function traverseRequirements(requirements: any, chapterNumber: string) {
      for (const requirementKey in requirements) {
        const requirement = requirements[requirementKey]
        const currentRequirementNumber = `${requirementKey}`

        if (requirement.checks) {
          traverseChecks(
            requirement.checks,
            currentRequirementNumber,
            chapterNumber
          )
        }
      }
    }

    function traverseChecks(
      checks: any,
      requirementNumber: string,
      chapterNumber: string
    ) {
      for (const checkKey in checks) {
        const check = checks[checkKey]
        if (
          (check.status == 'GREEN' ||
            check.status == 'YELLOW' ||
            check.status == 'RED') &&
          check.evaluation &&
          check.evaluation.results &&
          Array.isArray(check.evaluation.results)
        ) {
          for (const result of check.evaluation.results) {
            if (!result.fulfilled) {
              findings.push({
                chapter: chapterNumber,
                requirement: requirementNumber,
                check: checkKey,
                criterion: result.criterion,
                justification: result.justification,
                metadata: result.metadata,
              })
            }
          }
        }
      }
    }

    traverseChapters(parsedData.chapters)
  } catch (error) {
    Logger.error(`Error parsing YAML: ${error}`, 'extractFindings')
  }

  return findings
}

export function createFindingDto(
  runData: Run,
  finding: FindingQgResult
): CreateFindingDTO {
  const findingDto: CreateFindingDTO = {
    configId: runData.configId,
    runId: runData.id,
    runStatus: runData.status as RunStatus,
    runOverallResult: runData.overallResult as RunOverallStatusType,
    runCompletionTime: runData.completionTime,
    status: 'unresolved' as StatusType, // Assuming the status is initially unresolved
    chapter: finding.chapter,
    requirement: finding.requirement,
    check: finding.check,
    criterion: finding.criterion,
    justification: finding.justification,
    metadata: finding.metadata || {},
  }
  return findingDto
}

export function generateHash(findingDto: HashFields) {
  // Concatenate the fields to create the input for hashing
  const input =
    `${findingDto.namespaceId}${findingDto.configId}${findingDto.chapter}${findingDto.requirement}${findingDto.check}${findingDto.criterion}${findingDto.justification}`.replace(
      /\s/g,
      ''
    )
  // Generate the SHA256 hash
  const hash = createHash('sha256').update(input).digest('hex')
  Logger.debug(
    `Input for the SHA256 hash calculation: ${input}, hash: ${hash}`,
    'generateHash'
  )
  return hash
}

export function generateHashCalculationMessage(fidingDto: HashFields) {
  const { namespaceId, configId, chapter, requirement, check, justification } =
    fidingDto
  return `[Hash] namespaceId: ${namespaceId}, configId: ${configId}, chapter: ${chapter}, requirement: ${requirement}, check: ${check}, justification: ${justification}`
}
