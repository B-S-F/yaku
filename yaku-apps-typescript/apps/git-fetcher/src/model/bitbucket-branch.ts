export type BitbucketBranch = {
  id: string
  displayId: string
  type: 'BRANCH'
  latestCommit: string
  latestChangeset: string
  isDefault: boolean
}
