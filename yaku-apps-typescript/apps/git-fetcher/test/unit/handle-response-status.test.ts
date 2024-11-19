import { beforeEach, describe, expect, it, vi } from 'vitest'
import { handleResponseStatus } from '../../src/utils/handle-response-status'

const statusMessage: { status: number; serverType: string; message: string }[] =
  [
    {
      status: 404,
      serverType: 'bitbucket',
      message: 'Repository not found. Status code: 404',
    },
    {
      status: 404,
      serverType: 'github',
      message: 'Repository not found. Status code: 404',
    },
    {
      status: 401,
      serverType: 'github',
      message:
        'Could not access the required repository, SSO Token might not be authorized for the required organization. Status code: 401',
    },
    {
      status: 401,
      serverType: 'bitbucket',
      message: 'Could not access the required repository. Status code: 401',
    },
    {
      status: 403,
      serverType: 'github',
      message:
        'Could not access the required repository, SSO Token might not be authorized for the required organization. Status code: 403',
    },
    {
      status: 403,
      serverType: 'bitbucket',
      message: 'Could not access the required repository. Status code: 403',
    },
    {
      status: 500,
      serverType: 'github',
      message: 'Could not fetch data from git repository. Status code: 500',
    },
    {
      status: 500,
      serverType: 'bitbucket',
      message: 'Could not fetch data from git repository. Status code: 500',
    },
  ]

describe('HandleResponseStatus', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
  })

  it.each(statusMessage)(
    'throws an error with the corresponding error message, when status Code $status is returned.',
    ({ status, serverType, message }) => {
      vi.stubEnv('GIT_FETCHER_SERVER_TYPE', serverType)
      expect(() => handleResponseStatus(status)).toThrowError(message)
    },
  )
})
