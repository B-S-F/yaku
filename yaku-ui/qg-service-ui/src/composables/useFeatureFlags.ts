// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

/**
 * This composable contains booleans for feature flags
 */
const useFeatureFlags = () => {
  const useReleaseEmails = import.meta.env.VITE_TEST_RELEASE_EMAILS === 'true'
  const useTaskManagement = import.meta.env.VITE_TEST_TASK_MANAGEMENT === 'true'

  return {
    useReleaseEmails,
    useTaskManagement,
  }
}

export default useFeatureFlags
