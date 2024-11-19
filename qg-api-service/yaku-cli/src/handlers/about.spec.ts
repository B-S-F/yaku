import { jest } from '@jest/globals'
import fs from 'fs'
import { about } from './about'

describe('about()', () => {
  let readFileSyncSpy: any
  let consoleLogSpy: any
  const sbomContents = '{"dummy": true}'
  beforeEach(() => {
    readFileSyncSpy = jest
      .spyOn(fs, 'readFileSync')
      .mockReturnValue(sbomContents)
    consoleLogSpy = jest.spyOn(console, 'log').mockReturnValue()
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should read from sbom', () => {
    about({ sbom: true })

    expect(readFileSyncSpy).toHaveBeenCalled()
    expect(consoleLogSpy).toHaveBeenCalledWith(
      JSON.stringify(JSON.parse(sbomContents), null, 2),
    )
  })
  it('should present the static lines', () => {
    about({})

    expect(readFileSyncSpy).not.toHaveBeenCalled()
    expect(consoleLogSpy).toHaveBeenCalledWith('Yaku Client CLI\n')
    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Copyright Bosch Software Flow\n',
    )
    expect(consoleLogSpy).toHaveBeenCalledWith(
      `Use option '--sbom' to get further details on used open source components`,
    )
  })
})
