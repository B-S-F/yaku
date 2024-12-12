// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { ref } from 'vue'
import { Release } from '~/types/Release'

const release = ref<Release>()

const useReleaseDetails = () => {
  return {
    release,
  }
}

export default useReleaseDetails
