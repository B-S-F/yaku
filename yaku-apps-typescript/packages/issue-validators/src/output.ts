// SPDX-FileCopyrightText: 2022 2023 by grow platform GmbH
// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export function generatePropertyOutput(
  property: string,
  invalidPropertiesOutput: string[],
) {
  if (!invalidPropertiesOutput.length) return ''

  let output = `Result for property \`${property}\`:\n`
  invalidPropertiesOutput.forEach((propertyOutput) => {
    output += ' * ' + propertyOutput + '\n'
  })

  return output
}

export function generateGlobalOutput(outputs: string[]) {
  const reason = outputs.join('\n')
  const status =
    reason.includes('invalid') || reason.includes('no ') ? 'RED' : 'GREEN'
  console.log(JSON.stringify({ status, reason }))
}
