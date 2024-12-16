// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { KeycloakConfig } from 'keycloak-js'
import type { GetNamespaces } from '~/api'

/** Environments are fetched at runtime. These are the minimal properties available for every environment */
export type RawEnvironment = {
  label: string
  slug: string
  url: string
  appCatalogApi: string | null
  namespaces?: GetNamespaces
  isFallback?: boolean
  keycloakConfig: KeycloakConfig
}

/** Available environment have a supplementary namespaces property */
export type AvailableEnvironment = RawEnvironment & {
  state: 'available'
  namespaces: GetNamespaces
}
/** Unavailble environment does not have other properties than the raw environments. At least it is known they are unavailable. */
export type UnavailableEnvironment = RawEnvironment & {
  state: 'unreachable' | 'no-permission'
}

/** An environment can be available or unavailable. This information is determined at runtime. */
export type Environment = AvailableEnvironment | UnavailableEnvironment

export type UIConfig = {
  environments: RawEnvironment[]
}
