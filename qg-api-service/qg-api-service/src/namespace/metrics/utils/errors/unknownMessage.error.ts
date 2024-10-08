export class UnknownMessageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnknownMessageError'
  }
}
