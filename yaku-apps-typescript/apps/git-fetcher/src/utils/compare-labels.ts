import { GithubLabel } from '../model/github-label'

export function compareLabels(
  requiredLabels: string[] | undefined,
  fetchedLabels: GithubLabel[]
): boolean {
  let result = false
  if (requiredLabels && requiredLabels.length != 0) {
    const fetchedLabelsNames: string[] = []
    if (fetchedLabels.length != 0) {
      fetchedLabels.forEach((value) => {
        fetchedLabelsNames.push(value.name)
      })
    }
    const filteredLabels = requiredLabels.filter((item) =>
      fetchedLabelsNames.includes(item)
    )
    if (filteredLabels.length != 0) {
      result = true
    }
  }
  return result
}
