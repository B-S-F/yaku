import { getFilenameFromUrl, wait } from './utils'

describe('getFilenameFromURL()', () => {
  test('parses file URL properly', () => {
    expect(
      getFilenameFromUrl(
        'https://some.url/with/some/path/to/some/file.txt#something'
      )
    ).toEqual('file.txt')
  })
  test('parses file URL properly even with trailing slash', () => {
    expect(
      getFilenameFromUrl('https://some.url/with/some/path/to/some/file.txt/')
    ).toEqual('file.txt')
  })
})

describe('wait()', () => {
  test('returns a Promise which will call setTimeout', async () => {
    jest.spyOn(global, 'setTimeout')
    await wait(0.001)
    expect(setTimeout).toHaveBeenCalledTimes(1)
  })
})
