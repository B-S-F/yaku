import { Dispatcher } from 'undici'

export type YakuClientConfig = {
  baseUrl: string
  token: string
  agent?: Dispatcher
}

export type FileMetadata = {
  filepath: string
  filename?: string
}

export type Run = {
  id: number
  status: RunStatus
  config: string
  overallResult?: RunResult
  creationTime: Date
  completionTime?: Date
  argoNamespace?: string
  argoName?: string
  log?: string[]
}

export type RunResult = 'GREEN' | 'YELLOW' | 'RED' | 'PENDING' | 'FAILED'
// Temporary type which is used on findings. Similar to RunResult.
// This should be updated once the findings migration happens
export type RunOverallStatusType =
  | 'RED'
  | 'YELLOW'
  | 'GREEN'
  | 'UNANSWERED'
  | 'FAILED'
  | 'ERROR'
export type RunStatus = 'pending' | 'running' | 'completed' | 'failed'

export type FileList = {
  qgConfig?: string
  additionalConfigs?: string[]
}

export type Config = {
  id: number
  name: string
  description?: string
  creationTime: string
  lastModificationTime: string
  files: FileList
}

export type PaginatedData = {
  pagination: {
    pageNumber: number
    pageSize: number
    totalCount: number
  }

  links: {
    prev?: string
    next?: string
    last: string
    first: string
  }
}

export type RunPaginated = PaginatedData & {
  data: Run[]
}

export type ConfigPaginated = PaginatedData & { data: Config[] }

export type SecretMetadata = {
  name: string
  description?: string
  creationTime: string
  lastModificationTime: string
}

export type SecretPaginated = PaginatedData & { data: SecretMetadata[] }

export type NewTokenMetadata = {
  id: number
  description: string
  try_admin: boolean
  status: string
  createdBy: string
  lastModifiedBy: string
  creationTime: Date
  lastModificationTime: Date
}

export type NewToken = NewTokenMetadata & {
  token: string
}

export type FindingsPaginated = PaginatedData & { data: Findings[] }

export type Findings = {
  id: string
  metadata: FindingsMetadata
  configId: number
  runId: number
  runStatus: RunStatus
  runOverallStatus: RunOverallStatusType
  runCompletionTime: string
  chapter: string
  requirement: string
  check: string
  criterion: string
  justification: string
  occurrenceCount: number
  status: FindingsStatusType
  resolvedComment: string
  resolvedDate: string
  resolver: string
  createdAt: Date
  updatedAt: Date
}

export enum FindingsStatusType {
  UNRESOLVED = 'unresolved',
  RESOLVED = 'resolved',
}

export type FindingsMetadata = {
  [key: string]: any
}

export type Namespace = {
  id: number
  name: string
  users: any[]
}

export type VersionInformation = {
  imageVersion: string
  serviceVersion: string
  qgcliVersions: { [key: string]: string }
}
