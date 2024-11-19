// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { createLogger, Logger, format, transports } from 'winston'

let logger: Logger | null = null

export type LogLevel =
  | 'error'
  | 'warn'
  | 'info'
  | 'http'
  | 'verbose'
  | 'debug'
  | 'silly'

export function InitLogger(
  app: string,
  logLevel: LogLevel = 'info',
  logFile?: string
) {
  logger = createLogger({
    level: logLevel,
    format: format.combine(
      format.label({ label: app }),
      format.prettyPrint(),
      format.cli()
    ),
    transports: [new transports.Console()],
  })

  if (logFile) {
    logger.add(
      new transports.File({
        filename: logFile,
        format: format.combine(format.timestamp(), format.json()),
      })
    )
  }
  return logger
}

export function GetLogger(): Logger {
  if (!logger) {
    logger = InitLogger('unknown-app')
  }
  return logger
}

export function toLogLevel(logLevel: string): LogLevel {
  switch (logLevel.toLowerCase()) {
    case 'error':
      return 'error'
    case 'warn':
      return 'warn'
    case 'info':
      return 'info'
    case 'http':
      return 'http'
    case 'verbose':
      return 'verbose'
    case 'debug':
      return 'debug'
    case 'silly':
      return 'silly'
    default:
      return 'info'
  }
}
