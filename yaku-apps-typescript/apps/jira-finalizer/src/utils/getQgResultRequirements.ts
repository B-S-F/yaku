import { QgResult, Requirement } from './getQgResult'

type Requirements = {
  [key: string]: Requirement
}

export default function (qgResult: QgResult): Requirements {
  const requirements: Requirements = {}
  for (const [_, allocation] of Object.entries(qgResult.allocations)) {
    for (const [rquirementId, requirement] of Object.entries(
      allocation.requirements,
    )) {
      requirements[rquirementId] = requirement
    }
  }
  return requirements
}
