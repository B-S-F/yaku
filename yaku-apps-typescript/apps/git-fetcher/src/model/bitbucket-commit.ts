export type BitbucketCommit = {
  /** The commit hash */
  id: string
  /** Milliseconds since unix epoch of this commit */
  committerTimestamp: number
  [s: string]: unknown
}
