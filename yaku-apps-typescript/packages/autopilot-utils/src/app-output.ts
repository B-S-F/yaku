// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { Output, Result, Status } from './types.js'

export class AppOutput {
  data: {
    status: Status | undefined
    reason: string | undefined
    outputs: Output[]
    results: Result[]
  }

  constructor() {
    this.data = {
      status: undefined,
      reason: undefined,
      outputs: [],
      results: [],
    }
  }

  addResult(result: Result): void {
    this.data.results.push(result)
  }

  addOutput(output: Output): void {
    this.data.outputs.push(output)
  }

  setStatus(status: Status): void {
    this.data.status = status
  }

  setReason(reason: string): void {
    this.data.reason = reason
  }

  write(): void {
    for (const output of this.data.outputs) {
      console.log(JSON.stringify({ output: output }))
    }
    for (const result of this.data.results || []) {
      console.log(JSON.stringify({ result: result }))
    }
    const out: any = {}
    if (this.data.status) {
      out['status'] = this.data.status
    }
    if (this.data.reason) {
      out['reason'] = this.data.reason
    }
    if (Object.keys(out).length !== 0) {
      console.log(JSON.stringify(out))
    }
  }
}
