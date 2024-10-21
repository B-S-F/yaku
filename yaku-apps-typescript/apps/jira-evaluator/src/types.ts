import { Conditions, Issue } from '@B-S-F/issue-validators'

export interface InvalidIssues {
  [key: string]: {
    [Conditions.exists]: Issue[]
    [Conditions.expected]: Issue[]
    [Conditions.illegal]: Issue[]
  }
}
export interface Dictionary {
  [key: string]: any
}
