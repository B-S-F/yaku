// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

type Options = {
  withDollarSign?: boolean
  withLeftBracket?: boolean
  withRightBracket?: boolean
  withRightBrackets?: boolean
}
export const getCodeFromSecret = (
  secretName: string,
  opts: Options = {
    withDollarSign: true,
    withLeftBracket: true,
    withRightBracket: true,
    withRightBrackets: false,
  },
) => {
  return (
    `${opts.withDollarSign ? '$' : ''}` +
    `${opts.withLeftBracket ? '{' : ''}secrets.${secretName}${opts.withRightBracket ? '}' : ''}${opts.withRightBrackets ? '}' : ''}`
  )
}

export const copySecret = (secretName: string) => {
  if (!secretName || secretName === '') return ''
  return '${{ secrets.' + secretName + ' }}'
}
