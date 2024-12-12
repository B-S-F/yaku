// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { ConfirmDialogProps } from '~/types/Dialog'

export const toProps: (params: {
  old: string
  new: string
}) => ConfirmDialogProps = (params) => ({
  id: 'add-file-duplicate',
  type: 'info',
  title: 'The filename already exists.',
  headline: 'Rename the file instead?',
  content: `The file "${params.old}" already exists. The new one will be renamed to "${params.new}".`,
})
