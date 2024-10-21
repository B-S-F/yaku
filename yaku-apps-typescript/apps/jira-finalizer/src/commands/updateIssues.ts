import path from 'path'
import { JIRA_CONFIG_NAME, result_path } from '../config.js'
import getFilepath from '../utils/getFilepath.js'
import getConfig from '../utils/getJiraConfig.js'
import getQgResult, { Requirement } from '../utils/getQgResult.js'
import getQgResultRequirements from '../utils/getQgResultRequirements.js'
import addAttachment from './addAttachment.js'
import addComment from './addComment.js'

export default async function (): Promise<void> {
  const config = await getConfig(JIRA_CONFIG_NAME)
  if (!config) {
    throw new Error('No JIRA configuration found')
  }
  if (!config.requirements) {
    console.log('No requirements found in JIRA configuration')
    return
  }
  const qgResult = await getQgResult(path.join(result_path, 'qg-result.yaml'))
  const resultRequirements = getQgResultRequirements(qgResult)
  for (const [requirementId, configRequirement] of Object.entries(
    config.requirements
  )) {
    const requirement = resultRequirements[requirementId]
    if (!requirement) {
      console.log(`Requirement ${requirementId} not found`)
      continue
    }
    const jiraComment = createJiraComment(requirement)
    const sources = getSourcesOfRequirement(requirement)
    const promises: Promise<void>[] = []
    for (const issueId of configRequirement.issues) {
      promises.push(addComment(issueId, jiraComment))
      for (const source of sources) {
        const attachmentPath = await getFilepath(result_path, source)
        promises.push(addAttachment(issueId, attachmentPath))
      }
    }
    await Promise.all(promises)
  }
  console.log('Updated issues')
  return
}

export const getSourcesOfRequirement = (requirement: Requirement): string[] => {
  const allSources: string[] = []
  if (!requirement.checks) {
    return allSources
  }
  Object.values(requirement.checks).forEach((check) => {
    if (!check.reports) {
      return
    }
    check.reports.forEach((report) => {
      if (!report.componentResults) {
        return
      }
      report.componentResults.forEach((componentResult) => {
        if (!componentResult.sources) {
          return
        }
        const applicableSources = componentResult.sources.flatMap((source) => {
          if (source['jiraUpload'] != undefined) {
            return source['jiraUpload']
          }
          return []
        })
        allSources.push(...applicableSources)
      })
    })
  })
  return allSources
}

function createJiraComment(requirement: Requirement): string {
  let comment: string =
    `Requirement: ${requirement.title}\n` +
    `Text: ${requirement.text}\n` +
    `Status: ${requirement.status}\n`
  if (!requirement.checks) {
    comment += `Reason: ${requirement.reason}\n`
  } else {
    for (const [checkId, check] of Object.entries(requirement.checks)) {
      for (const report of check.reports) {
        for (const componentResult of report.componentResults) {
          comment += `Check ${checkId}\n`
          comment += `Report ${report.reportType}\n`
          comment += `Component ${componentResult.component.id} ${componentResult.component.version}\n`
          comment += `Result: ${componentResult.status}\n`
          if (componentResult.comments) {
            for (const resultComment of componentResult.comments) {
              comment += `Comment: ${JSON.stringify(resultComment, null, 2)}\n`
            }
            comment += '\n'
          }
        }
      }
    }
  }
  return comment
}
