import { config } from './config'

describe('config', () => {
  it('should contain version', () => {
    expect(config).toHaveProperty('version')
  })
})
