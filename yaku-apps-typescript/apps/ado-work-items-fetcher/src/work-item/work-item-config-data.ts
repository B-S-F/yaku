/**
 * Copyright (c) 2022, 2023 by grow platform GmbH
 */
import { generateErrorMessage } from 'zod-error'
import { SafeParseReturnType } from 'zod/lib/types'
import {
  AdoFetcherConfig,
  AdoFetcherConfigSchema,
  RelationType,
} from './index.js'

const DEFAULT_FIELDS = ['State', 'Title']

export interface YamlData {
  [key: string]: any
}

export class WorkItemConfigData {
  private readonly hierarchyDepth: number
  private readonly data: AdoFetcherConfig
  constructor(private readonly fetcherConfig: unknown) {
    const result: SafeParseReturnType<unknown, AdoFetcherConfig> =
      AdoFetcherConfigSchema.safeParse(fetcherConfig)
    if (result.success) {
      this.data = result.data
    } else {
      throw new Error(generateErrorMessage(result.error.issues))
    }

    this.hierarchyDepth = this.data.workItems?.hierarchyDepth ?? NaN
  }
  getRequestedFields(): string[] {
    const uncheckedNeededFields: unknown[] =
      this.data?.workItems?.neededFields ?? []
    for (const neededField of uncheckedNeededFields) {
      if (typeof neededField !== 'string') {
        throw new Error('workItems.neededFields may only contain string values')
      }
    }
    const neededFields: string[] = uncheckedNeededFields as string[]
    let combinedNeededFields = [...neededFields, ...DEFAULT_FIELDS]
    combinedNeededFields = combinedNeededFields.map((field: string) => {
      const trimmed: string = field.trim()
      return trimmed.charAt(0).toLowerCase() + field.slice(1)
    })
    return combinedNeededFields.filter((field: string) => field !== '')
  }

  // get the relation type from the yaml file recursively
  getRelationType(depth: number): RelationType | 'any' {
    const iterations = this.getHierarchyDepth() - depth
    let workItems = this.data.workItems
    for (let i = 0; i < iterations; i++) {
      if (workItems.relations) workItems = workItems.relations
    }
    return workItems.relations?.relationType ?? 'any'
  }

  private calculateHierarchyDepth(): number {
    let workItems = this.data.workItems
    let depth = 0
    while (workItems.relations && workItems.relations.get === true) {
      workItems = workItems.relations
      depth++
    }
    return depth
  }

  getQuery(): string | undefined {
    return this.data.workItems.query
  }

  getHierarchyDepth(): number {
    if (this.hierarchyDepth) return this.hierarchyDepth
    return this.calculateHierarchyDepth()
  }
}
