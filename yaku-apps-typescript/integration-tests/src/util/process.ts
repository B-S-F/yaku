// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import {
  ChildProcessWithoutNullStreams,
  spawn,
  SpawnOptionsWithoutStdio,
} from 'child_process'
import { EOL } from 'os'

export type RunProcessResult = {
  stdout: string[]
  stderr: string[]
  exitCode: number
}

function createProcess(
  executable: string,
  args: string[] = [],
  options: SpawnOptionsWithoutStdio = {},
): ChildProcessWithoutNullStreams {
  const nodeArgs: string[] = [executable, ...args]
  options.env ??= {}
  options.env = {
    ...options.env,
    PATH: process.env.PATH,
  }
  return spawn('node', nodeArgs, options)
}

/**
 * Run an executable in a child process using arguments.
 * @param executable - path to the executable to run
 * @param args - arguments the executable should be called with
 * @param options - further configuration properties for the child process (e.g. env variables)
 */
export async function run(
  executable: string,
  args: string[] = [],
  options?: SpawnOptionsWithoutStdio,
): Promise<RunProcessResult> {
  const childProcess: ChildProcessWithoutNullStreams = createProcess(
    executable,
    args,
    options,
  )
  childProcess.stdin.setDefaultEncoding('utf-8')

  return new Promise<RunProcessResult>((resolve) => {
    let stdout = ''
    let stderr = ''
    childProcess.stdout.on('data', (data) => {
      console.log(data.toString())
      stdout = `${stdout}${data.toString()}`
    })
    childProcess.stderr.on('data', (data) => {
      console.warn(data.toString())
      stderr = `${stderr}${data.toString()}`
    })
    childProcess.on('exit', (exitCode: number) =>
      resolve({
        stdout: stdout
          .replace(/(\r\n|\n|\r)/gm, EOL)
          .split(EOL)
          .filter((s) => s.length > 0),
        stderr: stderr
          .replace(/(\r\n|\n|\r)/gm, EOL)
          .split(EOL)
          .filter((s) => s.length > 0),
        exitCode: exitCode ?? 1,
      }),
    )
  })
}
