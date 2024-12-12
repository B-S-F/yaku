// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import Keycloak from 'keycloak-js'
import { Namespace } from '~/api'
import { RawEnvironment, UIConfig } from '~/types'

export class KeycloakService {
  private static instance: KeycloakService
  private keycloak: Keycloak | null = null
  private currentRealm: string | null = null
  private realms: RawEnvironment[] = []
  private userNamespaces: Namespace[] = []

  private constructor() {}

  public static getInstance(): KeycloakService {
    if (!KeycloakService.instance) {
      KeycloakService.instance = new KeycloakService()
    }
    return KeycloakService.instance
  }

  public async loadRealms(): Promise<void> {
    if (this.realms.length === 0) {
      try {
        const r = await fetch('/ui-config.json')
        if (!r.ok) {
          throw new Error('KeycloakService failed to load ui-config.json')
        }
        const envs = ((await r.json()) as UIConfig)?.environments
        this.realms = envs.map((env) => env)
      } catch (error) {
        console.error('KeycloakService: Error loading Realms', error)
        throw error
      }
    }
  }

  public getRealms(): RawEnvironment[] {
    if (this.realms.length === 0) {
      throw new Error('KeycloakService: Realms not loaded')
    }
    return this.realms
  }

  public getCurrentRealm(): string | null {
    return this.currentRealm
  }

  public async init(envSlug: string, redirectUri?: string): Promise<void> {
    // Load Realms from the config
    await this.loadRealms()
    const foundConfig = this.realms.find(
      (config) => config.slug === envSlug,
    )?.keycloakConfig
    if (!foundConfig) {
      throw new Error(`KeycloakService: Server ${envSlug} not found`)
    }

    this.keycloak = new Keycloak(foundConfig)
    await this.keycloak.init({
      onLoad: 'check-sso',
      redirectUri,
      checkLoginIframe: false,
    })
    localStorage.setItem('keycloak-last-init-server', envSlug)
    this.currentRealm = envSlug
  }

  public async loadUserNamespaces(): Promise<void> {
    if (!this.isAuthenticated || !this.getToken()) {
      throw new Error(`KeycloakService: User not authenticated`)
    }
    try {
      const envUrl = this.realms.find(
        (env) => env.slug === this.currentRealm,
      )?.url
      const r = await fetch(`${envUrl}/api/v1/namespaces`, {
        headers: {
          Authorization: `Bearer ${this.getToken()}`,
        },
      })
      if (!r.ok) {
        throw new Error(`KeycloakService: Failed to load namespaces`)
      }
      this.userNamespaces = await r.json()
    } catch (error) {
      console.error('KeycloakService: Failed to load namespaces')
      throw error
    }
  }

  public getUserNamespaces(): Namespace[] {
    if (this.userNamespaces.length === 0) {
      throw new Error('KeycloakService: Realms not loaded')
    }
    return this.userNamespaces
  }

  public async login(redirectUri?: string): Promise<void> {
    if (!this.keycloak) {
      throw new Error('KeycloakService: Keycloak Instance not found')
    }
    await this.keycloak.login({ redirectUri })
  }

  public async logout(): Promise<void> {
    if (!this.keycloak) {
      throw new Error('KeycloakService: Keycloak Instance not found')
    }
    await this.keycloak.logout()
  }

  public isAuthenticated(): boolean {
    return this.keycloak?.authenticated ?? false
  }

  public getToken(): string | undefined {
    return this.keycloak?.token
  }

  public getKeycloakInstance(): Keycloak | null {
    return this.keycloak
  }
}

export const keycloakService = KeycloakService.getInstance()
