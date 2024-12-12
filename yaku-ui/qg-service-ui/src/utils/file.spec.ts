// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { splitNameAndExt } from './file'

describe('file', () => {
  describe('splitNameAndText', () => {
    it('returns the basename and extension as expected', () => {
      const r = splitNameAndExt('filename.ext')

      expect(r).toStrictEqual({
        basename: 'filename',
        ext: 'ext',
      })
    })

    it('returns only the last extension', () => {
      const r = splitNameAndExt('filename.ext.ext2')

      expect(r).toStrictEqual({
        basename: 'filename',
        ext: 'ext.ext2',
      })
    })

    it('returns a basename only if there is no extension', () => {
      const r = splitNameAndExt('filename')

      expect(r).toStrictEqual({
        basename: 'filename',
        ext: undefined,
      })
    })

    it('returns an extension only', () => {
      const r = splitNameAndExt('.htaccess')

      expect(r).toStrictEqual({
        basename: '',
        ext: 'htaccess',
      })
    })
  })
})
