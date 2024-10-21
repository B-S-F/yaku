export type GithubDiffResponse = {
  url: string
  html_url: string
  permalink_url: string
  diff_url: string
  patch_url: string
  base_commit: any
  merge_base_commit: any
  status: string
  ahead_by: number
  behind_by: number
  total_commits: number
  commits: Array<any>
  files: Array<any>
}
