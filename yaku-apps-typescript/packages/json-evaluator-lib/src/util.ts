import { SearchOnFail } from './types'
import { AppError } from '@B-S-F/autopilot-utils'

/**
 * returns the search on fail bool from the default environment variable CONTINUE_SEARCH_ON_FAIL
 *
 * @param optional envVariableName
 * @returns true | false
 */
export function searchOnFail(
  envVariableName = 'CONTINUE_SEARCH_ON_FAIL'
): SearchOnFail {
  const logLevel: string = process.env[envVariableName] || 'TRUE'
  return validateSearchOnFail(logLevel)
}

function validateSearchOnFail(logLevel: string): boolean {
  const buff = logLevel.toUpperCase()
  if (buff === 'TRUE') {
    return true
  } else if (buff === 'FALSE') {
    return false
  } else {
    throw new AppError(`CONTINUE_SEARCH_ON_FAIL: ${logLevel}, is not valid!`)
  }
}
