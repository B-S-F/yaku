// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { useWindowSize } from '@vueuse/core'
import { computed } from 'vue'
import { useSidebarChecker } from '~/composables/useSidebarChecker'

export const useBreakpoints = () => {
  const { width: windowWidth } = useWindowSize()
  const { isSidebarOpen } = useSidebarChecker()
  const SIDE_NAVIGATION_EXPANDED_WIDTH = 304

  // get breakpoint value depending on sidebar toggle status
  const getBreakpointValue = (
    baseValue: number,
    offset: number = SIDE_NAVIGATION_EXPANDED_WIDTH,
  ) => {
    return isSidebarOpen.value ? baseValue + offset : baseValue
  }

  return computed(() => ({
    from600: windowWidth.value > getBreakpointValue(600),
    from640: windowWidth.value > getBreakpointValue(640),
    from710: windowWidth.value > getBreakpointValue(710),
    from750: windowWidth.value > getBreakpointValue(750),
    from820: windowWidth.value > getBreakpointValue(820),
    from830: windowWidth.value > getBreakpointValue(830),
    from870: windowWidth.value > getBreakpointValue(870),
    from920: windowWidth.value > getBreakpointValue(920),
    from940: windowWidth.value > getBreakpointValue(940),
    from960: windowWidth.value > getBreakpointValue(960),
    from1020: windowWidth.value > getBreakpointValue(1020),
    from1125: windowWidth.value > getBreakpointValue(1125),
    from1210: windowWidth.value > getBreakpointValue(1210),
    from1260: windowWidth.value > getBreakpointValue(1260),
    from1440: windowWidth.value > getBreakpointValue(1440),
    from1500: windowWidth.value > getBreakpointValue(1500),
    from1570: windowWidth.value > getBreakpointValue(1570),
  }))
}
