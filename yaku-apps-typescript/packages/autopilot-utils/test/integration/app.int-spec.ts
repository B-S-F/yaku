import { describe, it, expect } from 'vitest'
import { exec } from 'child_process'
import path from 'path'

function executeApp(args: string[], command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(
      `node ${path.join(__dirname, 'app.js')} ${command} ${args.join(' ')}`,
      (error, stdout, stderr) => {
        if (error) {
          reject(error)
        }
        if (stderr) {
          reject(stderr)
        }
        resolve(stdout)
      }
    )
  })
}

describe('evaluate', () => {
  it('should return help', async () => {
    const output = await executeApp([], '--help')
    expect(output).toContain('Usage: app [options] [command]')
  })

  it('should return green status', async () => {
    const output = await executeApp(['--green'], 'evaluate')
    expect(output).toContain('"status":"GREEN"')
  })

  it('should return red status', async () => {
    const output = await executeApp(['--red'], 'evaluate')
    expect(output).toContain('"status":"RED"')
  })

  it('should fail the evaluation', async () => {
    const output = await executeApp(['--fail'], 'evaluate')
    expect(output).toContain('"status":"FAILED"')
  })

  it('should throw an error', async () => {
    expect(executeApp(['--throw'], 'evaluate')).rejects.toThrow()
  })
})

describe('fetch', () => {
  it('should return help', async () => {
    const output = await executeApp([], '--help')
    expect(output).toContain('Usage: app [options] [command]')
  })

  it('should return green status', async () => {
    const output = await executeApp([], 'fetch')
    expect(output).toContain('{"output":{"test":"test"}}')
  })
})
