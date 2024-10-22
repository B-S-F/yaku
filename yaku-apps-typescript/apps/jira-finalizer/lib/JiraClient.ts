import { stat } from 'fs/promises'
import { RestClient } from './RestClient.js'
import { Comment } from './types/comment.js'
import FormData from 'form-data'
import { createReadStream } from 'fs'

export class JiraClient {
  private readonly client: RestClient

  public constructor(client: RestClient) {
    this.client = client
  }

  // https://developer.atlassian.com/cloud/jira/platform/rest/v2/api-group-issues/#api-rest-api-2-issue-issueidorkey-get
  async getIssue(id: string): Promise<any> {
    return this.client.get(`/issue/${id}`)
  }

  // https://developer.atlassian.com/cloud/jira/platform/rest/v2/api-group-issue-comments/#api-rest-api-2-issue-issueidorkey-comment-post
  async addComment(issueId: string, comment: string): Promise<Comment> {
    return this.client.post('/issue/' + issueId + '/comment', {
      body: comment,
    })
  }

  // https://developer.atlassian.com/cloud/jira/platform/rest/v2/api-group-issue-attachments/#api-rest-api-2-issue-issueidorkey-attachments-post
  async addAttachment(issueId: string, filePath: string): Promise<any> {
    const additionalHeaders = { 'X-Atlassian-Token': 'no-check' }
    const form = new FormData()
    const stats = await stat(filePath)
    const fileSizeInBytes = stats.size
    const fileStream = createReadStream(filePath)
    form.append('file', fileStream, { knownLength: fileSizeInBytes })
    return this.client.postFormData(
      '/issue/' + issueId + '/attachments',
      form,
      additionalHeaders
    )
  }

  // What does "Permissions required: Only the app that created the custom field can update its values with this operation" mean
  // https://developer.atlassian.com/cloud/jira/platform/rest/v2/api-group-issue-custom-field-values--apps-/#api-rest-api-2-app-field-fieldidorkey-value-put
  async updateCustomField(
    issueIds: string[],
    fieldId: string,
    value: string | number | Date
  ): Promise<any> {
    const body = {
      updates: {
        issueIds,
        value,
      },
    }
    return this.client.put(`/app/field/${fieldId}/value`, body)
  }
}
