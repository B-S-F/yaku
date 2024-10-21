import { GithubLabel } from './github-label'

export type GithubPr = {
  /** Uniquely identifies a pull request */
  number: number
  state: string
  labels: GithubLabel[]
  [s: string]: unknown
}
