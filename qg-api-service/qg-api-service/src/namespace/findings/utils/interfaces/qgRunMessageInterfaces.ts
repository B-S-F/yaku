export interface Run {
  globalId: number
  namespaceId: number
  id: number
  configId: number
  creationTime: string
  completionTime: string
  status: string
  overallResult: string
}

export interface FindingQgResult {
  chapter: string
  requirement: string
  check: string
  criterion: string
  justification: string
  metadata: {
    [key: string]: any
  }
}
