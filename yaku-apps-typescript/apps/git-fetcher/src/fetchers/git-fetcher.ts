// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export interface GitFetcher<T> {
  fetchResource(): Promise<T[] | T>
}
