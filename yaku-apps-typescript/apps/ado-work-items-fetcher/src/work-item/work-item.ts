/**
 * Copyright (c) 2022, 2023 by grow platform GmbH
 */

import { Issue } from '@B-S-F/issue-validators'
import { AxiosInstance, isAxiosError } from 'axios'
import {
  ADO_API_VERSION,
  ApiDetails,
  createApiUrl,
} from '../utils/api-details.js'
import { WorkItemsNotFoundError } from '../utils/custom-errors.js'
import { WorkItemConfigData, YamlData } from './work-item-config-data.js'

export interface WiqlRequestBody {
  query?: string
}
export interface Headers {
  [key: string]: string
}

export interface WorkItemReference {
  id: number
  url: string
}

export function createHeaders(personalAccessToken: string): Headers {
  return {
    Authorization:
      'Basic ' + Buffer.from(':' + personalAccessToken).toString('base64'),
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
}

export function createWiqlRequestBody(
  query: string | undefined
): WiqlRequestBody {
  return {
    query: query,
  }
}

export class WorkItem {
  constructor(
    private readonly headers: Headers,
    private readonly httpClient: AxiosInstance,
    private readonly configData: WorkItemConfigData,
    private readonly apiDetails: ApiDetails
  ) {}

  async queryReferences(): Promise<WorkItemReference[]> {
    const url: URL = createApiUrl(this.apiDetails)
    const wiqlRequestBody = createWiqlRequestBody(this.configData.getQuery())
    let response
    try {
      response = await this.httpClient.post(url.href, wiqlRequestBody, {
        headers: this.headers,
      })
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        if (error.response.status == 400) {
          throw new Error(
            `Request failed with status code ${error.response.status} ${error.response.statusText}. Please check your WIQL query for errors.`
          )
        }
        throw new Error(
          `Request failed with status code ${error.response.status} ${error.response.statusText}`
        )
      }
      throw error
    }
    const contentType = response.headers['content-type']
    if (
      response.status == 203 &&
      contentType &&
      contentType?.toString().split(';', 1)[0] == 'text/html'
    ) {
      throw new Error(
        `Server returned status 203 and some HTML code instead of JSON. It could be that your API token is wrong!`
      )
    }
    if (response.data.workItems) {
      return response.data.workItems
    } else {
      return []
    } //
  }

  private async getRecursively(
    parentUrl: string,
    depth: number
  ): Promise<Issue> {
    const url: URL = new URL(parentUrl)
    url.searchParams.append('api-version', ADO_API_VERSION)
    url.searchParams.append('$expand', 'relations')
    let response
    try {
      response = await this.httpClient.get(url.href, {
        headers: this.headers,
      })
    } catch (error: any) {
      const errorMessage = error.message ? error.message : error
      console.log(
        `Couldn't fetch relations, following error occurred: "${errorMessage}"`
      )
      return {}
    }

    if (response.data.relations && response.data.relations.length > 0) {
      const relationsData = []
      for (const relation of response.data.relations) {
        if (depth > 0) {
          const data = await this.getRecursively(relation.url, depth - 1)
          if (typeof data === 'object' && Object.keys(data).length !== 0) {
            data.relationType = relation.attributes.name
            relationsData.push(data)
          }
        }
      }
      response.data.relations = relationsData
    }
    return response.data
  }

  async getDetails(referenceList: WorkItemReference[]) {
    const data: Issue[] = []
    for (const reference of referenceList) {
      try {
        const depth = this.configData.getHierarchyDepth()
        const recursiveData = await this.getRecursively(reference.url, depth)
        data.push(recursiveData)
      } catch (error: any) {
        const errorMessage = error.message ? error.message : error
        throw Error(`Couldn't fetch details from work item reference with id "${
          reference.id
        }" - "${
          reference.url
        }" at depth "${this.configData.getHierarchyDepth()}"
        , following error occurred: "${errorMessage}"`)
      }
    }
    return data
  }

  private filterFields(workItem: Issue, neededFieldNames: string[]): Issue {
    const filteredWorkItem: Issue = {
      id: workItem.id || null,
      url: workItem._links ? workItem._links.html.href : '',
      ...(workItem.relationType && { relationType: workItem.relationType }),
      ...(workItem.error && { error: workItem.error }),
    }
    const allFieldNames = Object.keys(workItem.fields || {})

    for (const neededFieldName of neededFieldNames) {
      // field name at the end with case insensitivity
      const regex = new RegExp(`${neededFieldName}$`, 'gi')
      const matchingKeys = allFieldNames.filter((field) => regex.test(field))

      if (matchingKeys.length) {
        const firstFoundValue = matchingKeys[0]
        filteredWorkItem[neededFieldName] = workItem.fields[firstFoundValue]
      } else {
        console.warn(
          `The field '${neededFieldName}' is not available on work item with id ${workItem.id}`
        )
      }
    }
    return filteredWorkItem
  }

  private filterFieldsFromAllLevels(
    workItems: Issue[],
    neededFieldNames: string[]
  ): Issue[] {
    const filteredWorkItems: Issue[] = []
    workItems.forEach((workItem: Issue) => {
      const filteredData = this.filterFields(workItem, neededFieldNames)
      if (workItem.relations) {
        filteredData.relations = this.filterFieldsFromAllLevels(
          workItem.relations as Issue[],
          neededFieldNames
        )
      }
      filteredWorkItems.push(filteredData)
    })
    return filteredWorkItems
  }

  private filterRelations(
    workItems: Issue[],
    depth: number,
    configData: YamlData
  ): Issue[] {
    workItems.forEach((workItem: Issue) => {
      if ('relations' in workItem && workItem.relations.length !== 0) {
        const filteredRelations = []
        for (const relation of workItem.relations) {
          const relationType = this.configData.getRelationType(depth)
          if (
            relationType === 'any' ||
            relation.relationType === relationType
          ) {
            filteredRelations.push(relation)
          }
        }
        workItem.relations = filteredRelations
        if (workItem.relations.length !== 0 && depth > 0) {
          workItem.relations = this.filterRelations(
            workItem.relations,
            depth - 1,
            configData
          )
        }
      }
    })
    return workItems
  }

  filterData(workItems: Issue[]): Issue[] {
    if (!workItems.length) {
      throw new WorkItemsNotFoundError('No work items found!')
    }
    const neededFieldNames: string[] = this.configData.getRequestedFields()
    const filteredWorkItems: Issue[] = this.filterFieldsFromAllLevels(
      workItems,
      neededFieldNames
    )
    const finalWorkItems: Issue[] = this.filterRelations(
      filteredWorkItems,
      this.configData.getHierarchyDepth(),
      this.configData
    )
    return finalWorkItems
  }
}
