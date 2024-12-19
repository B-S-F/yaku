// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { ref, toRefs } from 'vue'
import { RunResultStatus } from '~/types/RunReport'
import { CHECK_DISPLAY_CONFIG, useCheckDisplay } from './useCheckDisplay'

describe('useCheckDisplay', () => {
  it('is reactive', () => {
    const statusRef = ref<RunResultStatus>('RED')
    const statusDisplay = useCheckDisplay(statusRef)
    expect(statusDisplay.icon).toStrictEqual(CHECK_DISPLAY_CONFIG.RED.icon)
  })

  it('is extracted prop reactive with toRefs', () => {
    const statusRef = ref<RunResultStatus>('RED')
    const { icon } = toRefs(useCheckDisplay(statusRef))
    expect(icon.value).toStrictEqual(CHECK_DISPLAY_CONFIG.RED.icon)
  })
})
