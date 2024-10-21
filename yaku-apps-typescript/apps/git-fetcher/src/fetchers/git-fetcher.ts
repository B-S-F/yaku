export interface GitFetcher<T> {
  fetchResource(): Promise<T[] | T>
}
