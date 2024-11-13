import { readFile } from 'fs/promises'
import yaml from 'yaml'
import path from 'path'

export interface Checks {
  [key: string]: {
    title: string
    reports: [
      {
        reportType?: string
        componentResults: [
          {
            component: {
              version: string
              id: string
            }
            status: Status
            comments: any[]
            sources: any[]
          }
        ]
      }
    ]
  }
}

export interface Requirement {
  title: string
  text: string
  reason?: string
  status: Status
  checks?: Checks
}

export interface Allocation {
  title: string
  status: Status
  requirements: {
    [key: string]: Requirement
  }
}

export interface QgResult {
  header: {
    name: string
    version: string
    date: string
    qgCliVersion: string
  }
  allocations: {
    [key: string]: Allocation
  }
  overallStatus: Status
}

export default async (filePath: string): Promise<QgResult> => {
  const resultPath = path.resolve(filePath)
  const qgResultContent = await readFile(resultPath, 'utf8')
  const qgResult = yaml.parse(qgResultContent)
  return qgResult as QgResult
}

type Status = 'GREEN' | 'YELLOW' | 'RED' | 'FAILED' | 'PENDING' | 'NA'
