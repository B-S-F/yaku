// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { App } from '~/types/App'

export const pdfSignatureEvaluator: App = {
  name: 'PDF Signature evaluator',
  envs: [
    {
      name: 'validate_signers',
      description:
        'If we want to compare the list of actual signers with a predefined list of expected signers, this parameter should be set to True. This will perform an additional check that will result in red output if the list of expected signers does not match the list of actual signers for each PDF file.',
      example: 'true',
    },
    {
      name: 'signer_file_path',
      description: 'This is the path to the list of expected signers.',
      example: './expected_signers.yaml',
    },
    {
      name: 'pdf_location',
      description:
        'The path to the directory containing the PDF files to be checked or the path pointing to a single file. The PDF files may be located in subfolders as this path is searched recursively.',
      example: '${env.PWD}',
    },
    {
      name: 'certificate_location',
      description:
        'The path to the directory containing the certificate files against which the PDF files are to be checked.',
      example: '/usr/local/share/ca-certificates/',
    },
  ],
}
