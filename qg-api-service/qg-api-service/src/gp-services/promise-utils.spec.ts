import { promiseOnTime } from './promise-utils'

describe('fetch with timeout', () => {
  const url = 'http://localhost:3000/'
  const response: any = { status: 200 }
  const options = { method: 'GET' }

  it('should work like standard fetch in good case', async () => {
    const result = await promiseOnTime(
      new Promise((resolve, _) => resolve(true)),
      2000
    )

    expect(result).toBe(true)
  })

  it('should throw an error, if timeout is earlier then promise returns', async () => {
    let timeout: any
    const workPromise = new Promise((resolve, _) => {
      timeout = setTimeout(() => resolve(true), 3000)
      return timeout
    })

    const startTime = Date.now()

    await expect(promiseOnTime(workPromise, 200)).rejects.toThrow()

    clearTimeout(timeout)

    const delta = Date.now() - startTime
    expect(delta).toBeGreaterThan(200)
    expect(delta).toBeLessThan(500)
  })
})
