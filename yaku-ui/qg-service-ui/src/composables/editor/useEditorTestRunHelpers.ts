// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { SingleCheck } from '~/api'

/** A yaml token is composed of the idententation and the line content without the indentation. */
type YamlToken = [number, string]

/** a stateless wrapper around the helpers. It separate this pure logic from the editor dependencies */
export const useEditorTestRunHelpers = () => {
  /**
   * extract the check path from an array of @param tokens (lines in the configuration).
   * The expected tokens starts from the chapters to the line where the user clicked on
   * Note: the function is exported for testing purposes
   */
  const _consumeTokens = (tokens: YamlToken[]): SingleCheck | undefined => {
    const getLastIndentationBlock = (
      tokens: YamlToken[],
      indentationLevel: number,
    ): YamlToken[] => {
      // copy, reverse and use indentationIndex to mimic Array.findLastIndex
      const lastMatchingIndentation = [...tokens]
        .reverse()
        .findIndex((t) => t[0] === indentationLevel)
      const indentationIndex = tokens.length - lastMatchingIndentation - 1
      return tokens.slice(indentationIndex, tokens.length)
    }

    const getNextIndentationLevel = (curr: number, step: number) =>
      curr + 2 * step

    if (tokens.length < 2) return undefined
    const path: Partial<SingleCheck> = {
      chapter: undefined,
      requirement: undefined,
      check: undefined,
    }
    const indentationStep = tokens[1][0] - tokens[0][0]

    if (!tokens.some((t) => t[1] === 'chapters')) return undefined
    let indentationDepth = indentationStep
    const chapterTokens = getLastIndentationBlock(tokens, indentationStep)
    path.chapter = chapterTokens.at(0)?.[1]

    if (!chapterTokens.some((t) => t[1] === 'requirements')) return undefined
    indentationDepth = getNextIndentationLevel(
      indentationDepth,
      indentationStep,
    )
    const requirementTokens = getLastIndentationBlock(
      chapterTokens,
      indentationDepth,
    )
    path.requirement = requirementTokens.at(0)?.[1]

    if (!requirementTokens.some((t) => t[1] === 'checks')) return undefined
    indentationDepth = getNextIndentationLevel(
      indentationDepth,
      indentationStep,
    )
    const checkTokens = getLastIndentationBlock(
      requirementTokens,
      indentationDepth,
    )
    path.check = checkTokens.at(0)?.[1]

    return Object.values(path).some((x) => x === undefined)
      ? undefined
      : (path as SingleCheck)
  }

  /**
   * The first group is the indentation string and the second is the key.
   * The space are catched to count the indentation. We can rely on spaces only because the yaml server forces it: (Tabs are not allowed as indentationYAML(0))
   */
  const YAML_KEY_MATCH = /^( *)["'']?(.+?)["'']?:$/

  /** get the yaml key and indentation of a line */
  const _extractToken = (
    line: string,
    regex = YAML_KEY_MATCH,
  ): YamlToken | undefined => {
    const tokenCandidate = regex.exec(line)
    const indentation = tokenCandidate?.at(1)?.length
    const value = tokenCandidate?.at(2)
    return indentation !== undefined && value !== undefined
      ? [indentation, value]
      : undefined
  }

  /** given a monaco editor model and a position, return the path of the focused configuration check. */
  const extractSingleCheckPath = (
    configuration: string[],
    lineSelectedIndex: number,
  ): SingleCheck | undefined => {
    const chapterStartLine = configuration.findIndex(
      (line) => line === 'chapters:',
    )

    const tokens: YamlToken[] = []
    for (let i = chapterStartLine; i <= lineSelectedIndex; i++) {
      const tokenCandidate = _extractToken(configuration[i])
      if (tokenCandidate === undefined) continue

      tokens.push(tokenCandidate)
      // premature break: when the line reached is outside of the "chapters" block, the selection is out of scope
      if (tokenCandidate[0] === 0 && i > chapterStartLine) {
        tokens.length = 0
        return undefined
      }
    }

    return _consumeTokens(tokens)
  }

  return {
    extractSingleCheckPath,
    _consumeTokens,
    _extractToken,
  }
}
