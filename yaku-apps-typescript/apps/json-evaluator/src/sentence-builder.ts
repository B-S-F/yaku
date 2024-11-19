// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export default class SentenceBuilder {
  message: string
  constructor() {
    this.message = ''
  }

  isPlural(quantity: string): boolean {
    // Change this to something that respects open closed principle
    if (quantity === 'one' || quantity === '') {
      return false
    }
    return true
  }

  getOperation(
    quantity: string | undefined,
    subject: string,
    reference: string,
    operation: string,
    receiver: string,
  ): string {
    const operationsList = []

    if (quantity) {
      operationsList.push(`${quantity} `)
    }

    if (subject) {
      operationsList.push(`_${subject}_ `)
    }

    if (reference) {
      operationsList.push(`_${reference}_ `)
    }

    if (subject || reference) {
      operationsList.push(quantity && this.isPlural(quantity) ? 'are ' : 'is ')
    }

    operationsList.push(`${operation} `)
    operationsList.push(receiver ? `_${receiver}_` : '\n')

    return operationsList.join('')
  }

  build() {
    return this.message
  }
}
