import { decodeBufferToUTF8EncodedString } from '@B-S-F/api-commons-lib'
import { BadRequestException, Injectable } from '@nestjs/common'
import * as YAML from 'yaml'
import { ZodError, z } from 'zod'
import { fromZodError } from 'zod-validation-error'

const initialCheck = `            manual:
              status: UNANSWERED
              reason: Initial implementation of the check
`

const RequirementSchema = z.object({
  title: z.string(),
  text: z.string().optional(),
  checks: z
    .record(
      z.string(),
      z.object({
        title: z.string(),
      })
    )
    .optional(),
})

const ChapterSchema = z.object({
  title: z.string(),
  requirements: z.record(z.string(), RequirementSchema),
})

const QuestionnaireSchema = z
  .object({
    project: z.string().optional(),
    version: z.string().optional(),
    chapters: z.record(z.string(), ChapterSchema),
  })
  .strict()

export type Requirement = z.infer<typeof RequirementSchema>
export type Chapter = z.infer<typeof ChapterSchema>
export type Questionnaire = z.infer<typeof QuestionnaireSchema>

@Injectable()
export class GeneratorService {
  public generateInitialConfig(questionnaire: Buffer | Questionnaire): string {
    const data = this.parseData(questionnaire)
    let config = this.generateSkeleton(data.project, data.version)

    for (const id of Object.keys(data.chapters)) {
      config = config + this.handleChapter(id, data.chapters[id])
    }

    return config
  }

  private handleChapter(id: string, input: Chapter): string {
    let chapter = `  '${id}':\n${this.yamlizeString(
      'title',
      4,
      input.title
    )}    requirements:\n`
    for (const rid of Object.keys(input.requirements)) {
      chapter = chapter + this.handleRequirement(rid, input.requirements[rid])
    }
    return chapter
  }

  private handleRequirement(rid: string, input: Requirement): string {
    let requirement = `      '${rid}':\n${this.yamlizeString(
      'title',
      8,
      input.title
    )}`

    if (input.text) {
      requirement = requirement + this.yamlizeString('text', 8, input.text)
    }

    requirement = requirement + '        checks:\n'
    if (input.checks && Object.keys(input.checks).length > 0) {
      for (const id of Object.keys(input.checks)) {
        const check = `          '${id}':\n${this.yamlizeString(
          'title',
          12,
          input.checks[id].title ?? 'Generated check title'
        )}${initialCheck}`
        requirement = requirement + check
      }
    } else {
      requirement =
        requirement +
        `          '1':\n${this.yamlizeString(
          'title',
          12,
          'Generated Check'
        )}${initialCheck}`
    }
    return requirement
  }

  private yamlizeString(prefix: string, indent: number, input: string): string {
    const indentFirst = ' '.repeat(indent)
    const indentString = ' '.repeat(indent + 2)
    const lines = input.split('\n')

    return (
      `${indentFirst}${prefix}: >-\n` +
      lines.map((line) => `${indentString}${line.trim()}`).join('\n') +
      '\n'
    )
  }

  private parseData(questionnaire: Buffer | Questionnaire): Questionnaire {
    if (!questionnaire) {
      throw new BadRequestException('No questionnaire data given')
    }

    if (!Buffer.isBuffer(questionnaire)) {
      return questionnaire
    }

    try {
      const data = YAML.parse(decodeBufferToUTF8EncodedString(questionnaire))
      return QuestionnaireSchema.parse(data)
    } catch (err) {
      const errorMessage =
        err instanceof ZodError ? fromZodError(err) : err.message
      throw new BadRequestException(
        `Could not parse the questionnaire data, error was ${errorMessage}`
      )
    }
  }

  private generateSkeleton(name: string, version: string): string {
    return `metadata:
  version: 'v1'
header:
  name: ${name ?? '<Enter project name>'}
  version: '${version ?? '<Enter project version>'}'
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
`
  }
}
