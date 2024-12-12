// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { onBeforeUnmount, onMounted, ref, getCurrentInstance } from 'vue'

export const useSidebarChecker = () => {
  const isSidebarOpen = ref(false)

  const checkSidebarOpen = () => {
    const appElement = document.querySelector('#app')
    if (appElement) {
      isSidebarOpen.value = appElement.classList.contains('-sidebar-open')
    }
  }

  // check and detect sidebar toggle status
  const setupSidebarChecker = () => {
    const appElement = document.querySelector('#app')

    if (appElement) {
      const observer = new MutationObserver(() => {
        checkSidebarOpen()
      })

      observer.observe(appElement, {
        attributes: true,
        attributeFilter: ['class'],
      })

      checkSidebarOpen()

      onBeforeUnmount(() => {
        observer.disconnect()
      })
    }
  }

  if (getCurrentInstance()) {
    onMounted(() => {
      setupSidebarChecker()
    })
  }

  return { isSidebarOpen }
}
