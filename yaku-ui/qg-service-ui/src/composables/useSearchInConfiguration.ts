// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { unref, computed, Ref, MaybeRef } from 'vue'
import type {
  ChapterConfiguration,
  CheckConfiguration,
  OnyxConfiguration,
  RequirementConfiguration,
} from '~/types/OnyxConfiguration'

/**
 * Given a text search, the function returns an adjusted configuration in which
 * chapters, requirements and checks have a matching element. It discards
 * checks that does not match the search, or requirements and chapters that does not have relevant content anymore.
 */
export const useSearchInConfiguration = (
  searchInput: MaybeRef<string>,
  configuration: Ref<OnyxConfiguration>,
) => {
  const sanitize = (s: string) => s.trim().toLowerCase()
  const removeEmpty = <T>(content: T | undefined): content is T => !!content
  const stack = <T extends Record<string | number | symbol, any>>(
    acc: T,
    el: Readonly<[id: keyof T, content: T[keyof T]]>,
  ) => {
    acc[el[0]] = el[1]
    return acc
  }
  const hasProperties = (o: object): boolean => Object.keys(o).length > 0

  // ------------------
  //  Search functions
  // ------------------
  const matchChapter = (
    search: string,
    chapter: ChapterConfiguration,
  ): boolean => sanitize(chapter.title).includes(search)
  const matchRequirement = (
    search: string,
    requirement: RequirementConfiguration,
  ): boolean =>
    sanitize(requirement.title).includes(search) ||
    sanitize(requirement.text ?? '').includes(search)
  const matchCheck = (search: string, check: CheckConfiguration): boolean => {
    if (
      sanitize(check.title).includes(search) ||
      sanitize(check.manual?.reason ?? '').includes(search)
    )
      return true

    const { automation } = check
    if (!automation) return false
    return (
      sanitize(automation.autopilot).includes(search) ||
      Object.entries(automation.env ?? {}).some((env) => matchEnv(search, env))
    )
  }
  const matchEnv = (
    search: string,
    [name, value]: [name: string, value: string],
  ) => sanitize(name).includes(search) || sanitize(value).includes(search)

  // -----------------------------------------------
  //  Iteration over the configuration with results
  // -----------------------------------------------
  const results = computed(() => {
    const search = sanitize(unref(searchInput))
    const config = unref(configuration)
    if (!search) return undefined

    const chapters = Object.entries(config.chapters)
      .map(([id, chapter]) => {
        if (matchChapter(search, chapter)) return [id, chapter] as const

        const requirements = Object.entries(chapter.requirements)
          .map(([id, requirement]) => {
            if (matchRequirement(search, requirement))
              return [id, requirement] as const

            const checks = Object.entries(requirement.checks)
              .map(([id, check]) => {
                if (matchCheck(search, check)) return [id, check] as const
              })
              .filter(removeEmpty)
              .reduce(stack, {} as Record<string, CheckConfiguration>)
            if (hasProperties(checks))
              return [id, { ...requirement, checks }] as const
          })
          .filter(removeEmpty)
          .reduce(stack, {} as Record<string, RequirementConfiguration>)
        if (hasProperties(requirements))
          return [id, { ...chapter, requirements }] as const
      })
      .filter(removeEmpty)
      .reduce(stack, {} as OnyxConfiguration['chapters'])

    return {
      ...config,
      chapters,
    }
  })

  return {
    results,
  }
}
