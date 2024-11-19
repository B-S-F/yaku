import getClient from '../utils/getClient.js'

export default async function (
  issueId: string,
  comment: string,
): Promise<void> {
  const client = getClient()
  const res = await client.addComment(issueId, comment)
  console.log(`Created comment with ID: ${res.id}`)
  return
}
