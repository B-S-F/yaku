export type BitbucketDiffResponse = {
  fromHash: string
  toHash: string
  contextLines: number
  whitespace: string
  diffs: any
  truncated: boolean
}
