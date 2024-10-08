import { readFileSync } from 'fs'
import { getServiceVersion } from './service-config'

describe('Service version', () => {
  it('should contain the proper service version', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'))
    expect(getServiceVersion()).toBe(packageJson.version)
  })
})
