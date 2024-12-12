// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { computed, Ref } from 'vue'
import { useRoute } from 'vue-router'
import { DOUBLE_HYPHEN } from '~/config/app'
import { ReplaceableVars, replaceAllVariables } from '~/helpers'
import { ConfigurationSection, SelectedSection } from '~/types'
import { OnyxConfiguration } from '~/types/OnyxConfiguration'

const contentIdNormalizer = (
  chapter: string,
  requirement: string | undefined,
): ConfigurationSection =>
  requirement
    ? `chapter${DOUBLE_HYPHEN}${chapter}${DOUBLE_HYPHEN}requirement${DOUBLE_HYPHEN}${requirement}`
    : `chapter${DOUBLE_HYPHEN}${chapter}`

const useVisualEditorNavigator = (
  config: Ref<OnyxConfiguration>,
  varsToReplace: ReplaceableVars,
) => {
  const route = useRoute()
  const currentContent = computed(() => route.query.content as SelectedSection)
  const contentNavItems = computed(() =>
    Object.entries(config.value.chapters).map(([id, chapter]) => ({
      id,
      name: chapter.title,
      to: {
        query: {
          editor: 'visual',
          content: contentIdNormalizer(id, undefined),
        },
      },
      subItems: Object.entries(chapter.requirements).map(
        ([requirementId, requirement]) => ({
          id: requirementId,
          name: replaceAllVariables(requirement.title, varsToReplace),
          to: {
            query: {
              editor: 'visual',
              content: contentIdNormalizer(id, requirementId),
            },
          },
        }),
      ),
    })),
  )
  return {
    currentContent,
    contentNavItems,
  }
}

export default useVisualEditorNavigator
