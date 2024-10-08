export abstract class SecretStorage {
  abstract getSecrets(namespaceId: number): Promise<{ [key: string]: string }>
  abstract storeSecret(
    namespaceId: number,
    name: string,
    secretValue: string
  ): Promise<void>
  abstract deleteSecret(namespaceId: number, name: string): Promise<void>
}
