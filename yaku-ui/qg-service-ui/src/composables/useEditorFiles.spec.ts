// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { MaybeRef } from '@vueuse/core'
import { useEditorFiles } from './useEditorFiles'

describe('useEditorFiles', () => {
  describe('batchEdits', () => {
    let edits: MaybeRef<ReturnType<typeof useEditorFiles>['edits']['value']> // make it a correct type
    let squashEdits: ReturnType<typeof useEditorFiles>['squashEdits'] // make it available in this describescope

    beforeAll(() => {
      squashEdits = useEditorFiles().squashEdits
    })

    it('return an empty array if there are no edits', () => {
      edits = []
      expect(squashEdits(edits)).toStrictEqual([])
    })

    it('return the sole edit', () => {
      edits = [{ id: 'a', type: 'add', filename: 'qg-config.yaml' }]
      expect(squashEdits(edits)).toStrictEqual(edits)
    })

    it('return an add if the add is followed by updates', () => {
      edits = [
        { id: 'a', type: 'add', filename: 'qg-config.yaml' },
        { id: 'a', type: 'update', filename: 'qg-config.yaml' },
        { id: 'a', type: 'update', filename: 'qg-config.yaml' },
      ]
      expect(squashEdits(edits)).toStrictEqual([
        { id: 'a', type: 'add', filename: 'qg-config.yaml' },
      ])
    })

    it('return all unrelated edits with different ids', () => {
      edits = [
        { id: 'a', type: 'add', filename: 'qg-config.yaml' },
        { id: 'b', type: 'add', filename: 'qg-config-b.yaml' },
        { id: 'c', type: 'add', filename: 'qg-config-c.yaml' },
        { id: 'd', type: 'add', filename: 'qg-config-d.yaml' },
      ]
      expect(squashEdits(edits)).toStrictEqual(edits)
    })

    it('squash an add, a remove and an add into an add', () => {
      edits = [
        { id: 'a', type: 'add', filename: 'qg-config.yaml' },
        { id: 'a', type: 'remove', filename: 'qg-config.yaml' },
        { id: 'a', type: 'add', filename: 'qg-config.yaml' },
      ]
      expect(squashEdits(edits)).toStrictEqual([
        { id: 'a', type: 'add', filename: 'qg-config.yaml' },
      ])
    })

    it('squash a remove and an add on the same filename into an update', () => {
      edits = [
        { id: 'a', type: 'remove', filename: 'qg-config.yaml' },
        { id: 'b', type: 'add', filename: 'qg-config.yaml' },
      ]
      expect(squashEdits(edits)).toStrictEqual([
        { id: 'a', type: 'update', filename: 'qg-config.yaml' },
      ])
    })

    it('untouch a remove and an add with a different name because it is a rename', () => {
      edits = [
        { id: 'a', type: 'remove', filename: 'qg-config.yaml' },
        { id: 'a', type: 'add', filename: 'qg-config-renamed.yaml' },
      ]
      expect(squashEdits(edits)).toStrictEqual(edits)
    })

    it('squash an add and a remove on the same filename into nothing', () => {
      edits = [
        { id: 'a', type: 'add', filename: 'qg-config.yaml' },
        { id: 'a', type: 'remove', filename: 'qg-config.yaml' },
      ]
      expect(squashEdits(edits)).toStrictEqual([])
    })

    it('squash an update and a remove on the same filename to a remove', () => {
      edits = [
        { id: 'a', type: 'update', filename: 'qg-config.yaml' },
        { id: 'a', type: 'remove', filename: 'qg-config.yaml' },
      ]
      expect(squashEdits(edits)).toStrictEqual([
        { id: 'a', type: 'remove', filename: 'qg-config.yaml' },
      ])
    })

    it('squash multiple updates', () => {
      edits = [
        { id: 'a', type: 'update', filename: 'qg-config.yaml' },
        { id: 'a', type: 'update', filename: 'qg-config.yaml' },
        { id: 'a', type: 'update', filename: 'qg-config.yaml' },
        { id: 'a', type: 'update', filename: 'qg-config.yaml' },
      ]
      expect(squashEdits(edits)).toStrictEqual([
        { id: 'a', type: 'update', filename: 'qg-config.yaml' },
      ])
    })

    it('squash updates from 2 files into one edit for each file', () => {
      edits = [
        { id: 'a', type: 'update', filename: 'qg-config.yaml' },
        { id: 'b', type: 'update', filename: 'qg-config-2.yaml' },
        { id: 'a', type: 'update', filename: 'qg-config.yaml' },
        { id: 'a', type: 'update', filename: 'qg-config.yaml' },
        { id: 'b', type: 'update', filename: 'qg-config-2.yaml' },
      ]
      expect(squashEdits(edits)).toStrictEqual([
        { id: 'a', type: 'update', filename: 'qg-config.yaml' },
        { id: 'b', type: 'update', filename: 'qg-config-2.yaml' },
      ])
    })

    it('squash multiple updates and a last remove into a remove', () => {
      edits = [
        { id: 'a', type: 'update', filename: 'qg-config.yaml' },
        { id: 'a', type: 'update', filename: 'qg-config.yaml' },
        { id: 'a', type: 'update', filename: 'qg-config.yaml' },
        { id: 'a', type: 'remove', filename: 'qg-config.yaml' },
      ]
      expect(squashEdits(edits)).toStrictEqual([
        { id: 'a', type: 'remove', filename: 'qg-config.yaml' },
      ])
    })

    it('squash multiple adds, updates and removes from 3 files', () => {
      edits = [
        { id: 'a', type: 'update', filename: 'qg-config.yaml' },
        { id: 'b', type: 'add', filename: 'qg-config--backup.yaml' },
        { id: 'c', type: 'update', filename: 'qg-autopilot-example.yaml' },
        { id: 'b', type: 'remove', filename: 'qg-config--backup.yaml' },
        { id: 'a', type: 'update', filename: 'qg-config.yaml' },
        { id: 'b', type: 'add', filename: 'qg-config--backup.yaml' },
        { id: 'd', type: 'remove', filename: 'qg-config-2.yaml' },
      ]
      expect(squashEdits(edits)).toStrictEqual([
        { id: 'c', type: 'update', filename: 'qg-autopilot-example.yaml' },
        { id: 'a', type: 'update', filename: 'qg-config.yaml' },
        { id: 'b', type: 'add', filename: 'qg-config--backup.yaml' },
        { id: 'd', type: 'remove', filename: 'qg-config-2.yaml' },
      ])
    })
  })
})
